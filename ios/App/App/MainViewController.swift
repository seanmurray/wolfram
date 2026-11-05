import UIKit
import Capacitor

// The storyboard's view controller, so the app's own plugins get registered
// (Capacitor 7 custom native code).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ClassReaderPlugin())
    }
}
