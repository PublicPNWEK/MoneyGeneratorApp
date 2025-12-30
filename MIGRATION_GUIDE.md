# React Native to Kotlin Native Migration Guide

## Overview

This document describes the migration from React Native to Kotlin Multiplatform with Compose Multiplatform.

## Migration Summary

### What Was Migrated

#### UI Components
All React Native components were converted to Compose Multiplatform:

| React Native | Kotlin Compose Multiplatform |
|--------------|------------------------------|
| `<View>` | `Column()`, `Row()`, `Box()` |
| `<Text>` | `Text()` |
| `<ScrollView>` | `LazyColumn()`, `LazyRow()` |
| `StyleSheet.create()` | `Modifier` chains |
| `useState` | `remember { mutableStateOf() }` |
| `useColorScheme()` | `isSystemInDarkTheme()` |
| `SafeAreaView` | `Scaffold` with safe area handling |

#### Data Models
TypeScript interfaces were converted to Kotlin data classes:

**Before (TypeScript):**
```typescript
type Card = {
  title: string;
  subtitle: string;
  bullets?: string[];
  tag?: string;
};
```

**After (Kotlin):**
```kotlin
data class Card(
    val title: String,
    val subtitle: String,
    val bullets: List<String>? = null,
    val tag: String? = null
)
```

#### Styling
React Native StyleSheet was converted to Compose Modifiers:

**Before (React Native):**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1220',
  },
  card: {
    backgroundColor: '#121b2e',
    borderRadius: 16,
    padding: 16,
  },
});
```

**After (Kotlin Compose):**
```kotlin
Modifier
    .fillMaxSize()
    .background(Color(0xFF0c1220))

Modifier
    .clip(RoundedCornerShape(16.dp))
    .background(Color(0xFF121b2e))
    .padding(16.dp)
```

### Project Structure Changes

#### Before (React Native)
```
MoneyGeneratorApp/
├── App.tsx                 # Main UI component
├── index.js               # Entry point
├── package.json           # Dependencies
├── android/               # Android native code
├── ios/                   # iOS native code
└── node_modules/          # JavaScript dependencies
```

#### After (Kotlin Native)
```
MoneyGeneratorApp/
├── composeApp/
│   └── src/
│       ├── commonMain/    # Shared Kotlin code
│       ├── androidMain/   # Android-specific
│       └── iosMain/       # iOS-specific
├── androidApp/            # Android app module
├── build.gradle.kts       # Gradle build config
└── settings.gradle.kts    # Module configuration
```

### Build System Changes

#### Before
- **Build Tool**: Metro bundler + npm/yarn
- **Commands**: 
  - `npm start` - Start Metro
  - `npm run android` - Build Android
  - `npm run ios` - Build iOS

#### After
- **Build Tool**: Gradle with Kotlin Native
- **Commands**:
  - `./gradlew :androidApp:assembleDebug` - Build Android
  - `./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64` - Build iOS

### Dependencies

#### Removed (React Native)
- `react`
- `react-native`
- `@react-native/*` packages
- `babel`
- `metro`
- `eslint` (JavaScript linting)
- `typescript` (for JavaScript/TypeScript)

#### Added (Kotlin Native)
- `org.jetbrains.kotlin.multiplatform`
- `org.jetbrains.compose` (Compose Multiplatform)
- `com.android.library` / `com.android.application`
- `androidx.activity:activity-compose`

## Benefits of Migration

### Performance
- **No JavaScript Bridge**: Direct native execution
- **Faster Startup**: No JS bundle loading
- **Better Memory**: Native memory management
- **Smoother Animations**: Native rendering pipeline

### Development
- **Type Safety**: Full Kotlin type system
- **Single Language**: Kotlin for all platforms
- **Better IDE Support**: Full IntelliJ/Android Studio integration
- **Easier Debugging**: Native debugging tools

### Maintenance
- **Simpler Dependencies**: No npm/node_modules
- **Clearer Architecture**: Multiplatform module structure
- **Native APIs**: Direct access to platform APIs
- **Future-Proof**: Kotlin Native actively developed

## Migration Challenges

### Learning Curve
- **Compose UI**: Different from React concepts
- **Kotlin Language**: If team is TypeScript/JavaScript focused
- **Gradle**: Different build system from npm

### Tooling
- **No Hot Reload**: Slower iteration than React Native Fast Refresh
- **Build Time**: Initial Gradle builds slower than Metro
- **Debugging**: Different tools (Android Studio vs Chrome DevTools)

## File Correspondence

### Main Application
- `App.tsx` → `composeApp/src/commonMain/kotlin/com/moneygeneratorapp/App.kt`
- `index.js` → `androidApp/src/main/kotlin/com/moneygeneratorapp/MainActivity.kt`

### Configuration
- `package.json` → `gradle/libs.versions.toml`
- `android/build.gradle` → `build.gradle.kts`
- `android/app/build.gradle` → `androidApp/build.gradle.kts`

### Assets & Resources
- React Native assets → `composeApp/src/commonMain/resources/`
- Android resources → `androidApp/src/main/res/`

## Code Examples

### Component Migration Example

**Before (React Native):**
```typescript
function Hero() {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Money Generator</Text>
      <Text style={styles.heroSubtitle}>
        Build once, deploy everywhere.
      </Text>
    </View>
  );
}
```

**After (Kotlin Compose):**
```kotlin
@Composable
fun Hero() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(AppColors.heroBackground)
            .padding(20.dp)
    ) {
        Text(
            text = "Money Generator",
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold
        )
        Text(
            text = "Build once, deploy everywhere.",
            fontSize = 15.sp
        )
    }
}
```

### List Rendering

**Before (React Native):**
```typescript
{cards.map(card => (
  <View key={card.title} style={styles.card}>
    <Text>{card.title}</Text>
  </View>
))}
```

**After (Kotlin Compose):**
```kotlin
cards.forEach { card ->
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(AppColors.cardBackground)
    ) {
        Text(text = card.title)
    }
}
```

## Testing the Migration

### Verification Steps

1. **Build Succeeds**: `./gradlew build`
2. **Android APK Created**: `./gradlew :androidApp:assembleDebug`
3. **App Installs**: `./gradlew :androidApp:installDebug`
4. **UI Renders Correctly**: Visual inspection
5. **All Features Work**: Functional testing

### Known Limitations

- **Network Required**: First build needs internet for dependencies
- **Build Cache**: First build slower, subsequent builds faster
- **Platform**: iOS builds require macOS with Xcode

## Rollback Plan

If migration needs to be reverted:

1. The original React Native code is preserved in:
   - `README_REACT_NATIVE.md.backup`
   - `BUILD_INSTRUCTIONS.md` (original)
   - Git history (commit before migration)

2. React Native files are listed in `.gitignore` but not deleted

3. To rollback:
   ```bash
   git revert <migration-commit-hash>
   npm install
   npm start
   ```

## Next Steps

1. **Test thoroughly** on physical devices
2. **Performance profiling** to verify improvements
3. **Update CI/CD** pipelines for Gradle builds
4. **Train team** on Kotlin Compose
5. **Remove React Native** files after verification

## References

- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
- [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
- [Kotlin Native](https://kotlinlang.org/docs/native-overview.html)
- [Compose for Android](https://developer.android.com/jetpack/compose)

## Support

For issues or questions about the migration:
- Check [README.md](README.md) for build instructions
- See [README_KOTLIN_NATIVE.md](README_KOTLIN_NATIVE.md) for detailed documentation
- Review [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for legacy React Native instructions
