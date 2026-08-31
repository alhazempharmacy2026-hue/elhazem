// إعدادات Metro لمشروع Expo داخل monorepo — بيتبع دليل Expo الرسمي لدعم الـ workspaces
// (https://docs.expo.dev/guides/monorepos/) عشان يقدر يلاقي @elhazem/shared جوه packages/shared
// من غير أي خطوة build منفصلة.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// راقب كل الـ monorepo عشان أي تعديل في packages/shared يترصد فورًا
config.watchFolders = [workspaceRoot]

// دور على node_modules في مشروع التطبيق الأول، وبعدين في جذر الـ monorepo (لأن npm workspaces
// بيعمل hoist لمعظم الحزم المشتركة هناك)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// امنع Metro من الصعود التلقائي فوق nodeModulesPaths المحددة أعلاه — موصى به في دليل Expo
// للـ monorepos عشان يتجنب لخبطة في نسخ الحزم بين التطبيقات المختلفة
config.resolver.disableHierarchicalLookup = true

module.exports = config
