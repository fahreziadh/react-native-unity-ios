/**
 * Patch @azesmway/react-native-unity iOS runtime init for Expo/RN New Architecture.
 *
 * Why:
 * - In some setups Unity initializes but never gets embedded into the RN view hierarchy,
 *   or initialization doesn't reliably trigger under Fabric.
 * - The upstream code also manipulates UIWindow/UIScene, which can break visibility in
 *   UIScene-based apps (common with Expo).
 *
 * This script is intentionally idempotent: it only writes when changes are needed.
 */
const fs = require("fs");
const path = require("path");

// Resolve the installed package location (works with hoisted node_modules in monorepos).
const unityPkgJsonPath = require.resolve(
  "@azesmway/react-native-unity/package.json",
  { paths: [process.cwd()] }
);
const unityPkgRoot = path.dirname(unityPkgJsonPath);
const targetFile = path.join(unityPkgRoot, "ios", "RNUnityView.mm");

function fail(msg) {
  console.error(`[patch-react-native-unity] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  fail(`Target file not found: ${targetFile}`);
}

let src = fs.readFileSync(targetFile, "utf8");

let changed = false;

// Note: We intentionally do NOT patch Unity's execute-header logic.
// Some setups will fail to link if we touch `_mh_execute_header` / `_mh_dylib_header`.

// 3) Stop manipulating UIWindow/UIScene; embed rootView directly into RNUnityView.
{
  const next = src.replace(
  /\[\[self ufw\] appController\]\.quitHandler = \^\(\)\{ NSLog\(@\"AppController\.quitHandler called\"\); \};\s*\n\s*\[self\.ufw\.appController\.rootView removeFromSuperview\];\s*\n\s*if \(@available\(iOS 13\.0, \*\)\) \{\s*\n\s*\[\[\[\[self ufw\] appController\] window\] setWindowScene: nil\];\s*\n\s*\} else \{\s*\n\s*\[\[\[\[self ufw\] appController\] window\] setScreen: nil\];\s*\n\s*\}\s*\n\s*\[\[\[\[self ufw\] appController\] window\] addSubview: self\.ufw\.appController\.rootView\];\s*\n\s*\[\[\[\[self ufw\] appController\] window\] makeKeyAndVisible\];\s*\n\s*\[\[\[\[\[\[\[self ufw\] appController\] window\] rootViewController\] view\] setNeedsLayout\];/gm,
  `[[self ufw] appController].quitHandler = ^(){ NSLog(@"AppController.quitHandler called"); };

        // Keep Unity embedded inside this React Native view. Avoid manipulating
        // UIWindow / UIWindowScene here, as it can break visibility under UIScene-based apps.
        if (self.ufw.appController.rootView.superview != self) {
            self.ufw.appController.rootView.frame = self.bounds;
            [self addSubview:self.ufw.appController.rootView];
        }
        [self setNeedsLayout];`
);
  if (next !== src) changed = true;
  src = next;
}

// 4) Ensure Unity initialization happens even if Fabric doesn't trigger updateProps early.
{
  const next = src.replace(
  /- \(void\)layoutSubviews \{\s*\n\s*\[super layoutSubviews\];\s*\n\s*\n\s*if\(\[self unityIsInitialized\]\) \{\s*\n\s*self\.ufw\.appController\.rootView\.frame = self\.bounds;\s*\n\s*\[self addSubview:self\.ufw\.appController\.rootView\];\s*\n\s*\}\s*\n\}/m,
  `- (void)layoutSubviews {
   [super layoutSubviews];

   if(![self unityIsInitialized]) {
      [self initUnityModule];
   }

   if([self unityIsInitialized]) {
      self.ufw.appController.rootView.frame = self.bounds;
      if (self.ufw.appController.rootView.superview != self) {
        [self addSubview:self.ufw.appController.rootView];
      }
   }
}`
);
  if (next !== src) changed = true;
  src = next;
}

if (!src.includes("Keep Unity embedded inside this React Native view")) {
  fail(
    "Patch did not apply cleanly (library source likely changed). Re-check RNUnityView.mm and update the patch script."
  );
}

fs.writeFileSync(targetFile, src, "utf8");
if (changed) {
  console.log("[patch-react-native-unity] Patched RNUnityView.mm");
} else {
  process.exit(0);
}


