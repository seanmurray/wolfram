import UIKit
import UniformTypeIdentifiers

// Share → Wolfram. Reads nothing: it copies the shared image, or the shared
// text and URL, into the App Group's ShareQueue/ with the time it was shared,
// and Wolfram's ClassReader plugin picks it up the next time the app opens
// (docs/specs/class-from-screenshot.md). Apple doesn't let an extension open
// its app, so the sheet just says it's saved.
//
// Queue entries: "<ms>-<uuid>.json" holding { at, image } or { at, text },
// with the image beside it. The image is written first, so an entry never
// points at a file that isn't there yet.
class ShareViewController: UIViewController {
    private let appGroup = "group.com.seanmurray.wolfram"
    private let message = UILabel()
    private let done = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0xf5 / 255, green: 0xef / 255, blue: 0xe6 / 255, alpha: 1)

        message.text = "Saving for Wolfram…"
        message.textColor = UIColor(red: 0x2b / 255, green: 0x27 / 255, blue: 0x24 / 255, alpha: 1)
        message.font = .preferredFont(forTextStyle: .title3)
        message.adjustsFontForContentSizeCategory = true
        message.numberOfLines = 0
        message.textAlignment = .center

        done.setTitle("Done", for: .normal)
        done.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        done.isEnabled = false
        done.addTarget(self, action: #selector(finish), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [message, done])
        stack.axis = .vertical
        stack.spacing = 24
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor, constant: -16),
        ])

        save { [weak self] saved in
            DispatchQueue.main.async {
                self?.message.text = saved
                    ? "Saved for Wolfram. Open Wolfram to check it and add it."
                    : "Couldn't save that for Wolfram. Try sharing a screenshot of the class page."
                self?.done.isEnabled = true
            }
        }
    }

    @objc private func finish() {
        extensionContext?.completeRequest(returningItems: nil)
    }

    private func save(_ completion: @escaping (Bool) -> Void) {
        guard let queue = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroup)?
            .appendingPathComponent("ShareQueue", isDirectory: true),
              (try? FileManager.default.createDirectory(at: queue, withIntermediateDirectories: true)) != nil else {
            completion(false)
            return
        }
        let at = (Date().timeIntervalSince1970 * 1000).rounded()
        let stem = String(format: "%013.0f", at) + "-" + UUID().uuidString
        let items = extensionContext?.inputItems as? [NSExtensionItem] ?? []
        let providers = items.flatMap { $0.attachments ?? [] }

        if let image = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) {
            image.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
                guard let data = Self.imageData(item) else { return completion(false) }
                let file = queue.appendingPathComponent(stem + ".img")
                guard (try? data.write(to: file, options: .atomic)) != nil else { return completion(false) }
                completion(Self.writeEntry(["at": at, "image": file.lastPathComponent], to: queue, stem: stem))
            }
            return
        }

        // Text: the item's own text, any plain-text attachment, then the URL,
        // one per line. ClassPass names the studio in the text, not the URL.
        var parts: [String] = items.compactMap { $0.attributedContentText?.string }
        let group = DispatchGroup()
        let lock = NSLock()
        var texts: [String] = []
        var urls: [String] = []
        for p in providers {
            if p.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                group.enter()
                p.loadItem(forTypeIdentifier: UTType.url.identifier) { item, _ in
                    if let url = item as? URL, !url.isFileURL { lock.lock(); urls.append(url.absoluteString); lock.unlock() }
                    group.leave()
                }
            } else if p.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                group.enter()
                p.loadItem(forTypeIdentifier: UTType.plainText.identifier) { item, _ in
                    let s = (item as? String) ?? (item as? Data).flatMap { String(data: $0, encoding: .utf8) }
                    if let s = s { lock.lock(); texts.append(s); lock.unlock() }
                    group.leave()
                }
            }
        }
        group.notify(queue: .global()) {
            parts += texts
            let joined = parts.joined(separator: "\n")
            parts += urls.filter { !joined.contains($0) }
            var seen = Set<String>()
            let text = parts
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty && seen.insert($0).inserted }
                .joined(separator: "\n")
            guard !text.isEmpty else { return completion(false) }
            completion(Self.writeEntry(["at": at, "text": text], to: queue, stem: stem))
        }
    }

    private static func imageData(_ item: NSSecureCoding?) -> Data? {
        if let url = item as? URL { return try? Data(contentsOf: url) }
        if let image = item as? UIImage { return image.pngData() }
        return item as? Data
    }

    private static func writeEntry(_ entry: [String: Any], to queue: URL, stem: String) -> Bool {
        guard let data = try? JSONSerialization.data(withJSONObject: entry) else { return false }
        return (try? data.write(to: queue.appendingPathComponent(stem + ".json"), options: .atomic)) != nil
    }
}
