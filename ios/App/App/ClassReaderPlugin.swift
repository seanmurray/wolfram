import Foundation
import Capacitor
import PhotosUI
import Vision

// Reads the text in a screenshot on the phone with Apple's Vision framework,
// for src/lib/classReader.js (docs/specs/class-from-screenshot.md).
//   - pickAndRead(): the system photo picker (no permission needed), then
//     { lines } or { cancelled: true };
//   - takeShared(): every item WolframShare queued in the App Group, oldest
//     first, as { items: [{ lines, at } | { text, at }] }; the queue is then
//     deleted, images included.
// Lines are [{ text, x, y, w, h }], 0–1 from the top-left.
@objc(ClassReaderPlugin)
public class ClassReaderPlugin: CAPPlugin, CAPBridgedPlugin, PHPickerViewControllerDelegate {
    public let identifier = "ClassReaderPlugin"
    public let jsName = "ClassReader"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickAndRead", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeShared", returnType: CAPPluginReturnPromise),
    ]

    static let appGroup = "group.com.seanmurray.wolfram"
    private var pickCall: CAPPluginCall?
    private let work = DispatchQueue(label: "com.seanmurray.wolfram.classreader", qos: .userInitiated)

    @objc func pickAndRead(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            var config = PHPickerConfiguration()
            config.filter = .images
            config.selectionLimit = 1
            let picker = PHPickerViewController(configuration: config)
            picker.delegate = self
            self.pickCall?.resolve(["cancelled": true])
            self.pickCall = call
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }

    public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let call = pickCall else { return }
        pickCall = nil
        guard let provider = results.first?.itemProvider,
              provider.canLoadObject(ofClass: UIImage.self) else {
            call.resolve(["cancelled": true])
            return
        }
        provider.loadObject(ofClass: UIImage.self) { [weak self] object, _ in
            guard let self = self else { return }
            guard let cg = (object as? UIImage)?.cgImage else {
                call.resolve(["lines": []])
                return
            }
            self.work.async { call.resolve(["lines": Self.readLines(cg)]) }
        }
    }

    @objc func takeShared(_ call: CAPPluginCall) {
        work.async {
            guard let queue = Self.queueDir() else {
                call.resolve(["items": []])
                return
            }
            let fm = FileManager.default
            let files = ((try? fm.contentsOfDirectory(at: queue, includingPropertiesForKeys: nil)) ?? [])
                .filter { $0.pathExtension == "json" }
                .sorted { $0.lastPathComponent < $1.lastPathComponent }
            var items: [[String: Any]] = []
            for meta in files {
                defer { try? fm.removeItem(at: meta) }
                guard let data = try? Data(contentsOf: meta),
                      let entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { continue }
                let at = entry["at"] as? Double ?? 0
                if let name = entry["image"] as? String {
                    let file = queue.appendingPathComponent(name)
                    defer { try? fm.removeItem(at: file) }
                    let lines = UIImage(contentsOfFile: file.path)?.cgImage.map(Self.readLines) ?? []
                    items.append(["lines": lines, "at": at])
                } else if let text = entry["text"] as? String, !text.isEmpty {
                    items.append(["text": text, "at": at])
                }
            }
            // Anything left (an image whose entry never got written) goes too.
            for leftover in (try? fm.contentsOfDirectory(at: queue, includingPropertiesForKeys: nil)) ?? [] {
                try? fm.removeItem(at: leftover)
            }
            call.resolve(["items": items])
        }
    }

    static func queueDir() -> URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroup)?
            .appendingPathComponent("ShareQueue", isDirectory: true)
    }

    static func readLines(_ image: CGImage) -> [[String: Any]] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["en-US"]
        request.usesLanguageCorrection = true
        do {
            try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
        } catch {
            return []
        }
        return (request.results ?? []).compactMap { obs in
            guard let text = obs.topCandidates(1).first?.string else { return nil }
            let box = obs.boundingBox
            return [
                "text": text,
                "x": Double(box.origin.x),
                "y": Double(1 - (box.origin.y + box.height)),
                "w": Double(box.width),
                "h": Double(box.height),
            ]
        }
    }
}
