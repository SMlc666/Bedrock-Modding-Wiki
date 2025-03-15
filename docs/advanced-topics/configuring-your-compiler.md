# 配置你的编译器

## 选择编译器

根据你想要针对的 Minecraft: 基岩版模组平台，你需要使用正确的编译器和标准模板库 ([STL](https://en.wikipedia.org/wiki/Standard_Template_Library))，以实现语言特性和库特性的完整 ABI 兼容性。

下表粗略地指导你为给定的基岩版平台选择哪个编译器。它并非完全精确或完整（目前）：

| 平台    | 编译器  | STL           |
|:--------|:------|:--------------|
| Windows | MSVC  | Microsoft STL |
| Android | GCC   | libstdc++     |
| OSX/iOS | Clang | libc++        |

一般来说，使用表中提供的编译器和 STL 的最新版本应该没问题。如果将来发现任何明显的兼容性问题，该表将相应更新。

> [!IMPORTANT]
> **重要提示**：如果你要针对 Windows 平台，必须配置正确的运行时库，请[继续阅读](/advanced-topics/configuring-your-compiler.html#setting-the-runtime-library)。

## 设置运行时库

当针对 Windows 平台时，STL 容器 ABI 和 C 运行时函数兼容性会受到所使用运行时库（**Release** 或 **Debug**）的影响。由于官方 Minecraft: 基岩版版本是使用 **Release** 模式库编译的，因此你的模组必须使用 **Release** 模式库，即使在编译调试版本时也是如此。

### CMake

CMake 3.15 引入了 `MSVC_RUNTIME_LIBRARY` 属性。 有 2 个相关的值：

1. `MultiThreaded` - 静态链接，发布模式运行时库
2. `MultiThreadedDLL` - 动态链接，发布模式运行时库

选择动态链接运行时库将要求你的模组用户下载相关的 Visual C++ 可再发行组件包，以换取更小的二进制文件大小。静态链接运行时库则相反。

针对动态链接运行时库进行编译通常更快，因此值得考虑在调试版本中使用动态链接，在发布版本中使用静态链接。CMake 生成器表达式可以方便地实现此行为：

```CMake
set_property(TARGET MyTarget PROPERTY
    # 在发布模式下静态链接，在调试模式下动态链接
    MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:DLL>")
```

或者，如果你只想对所有构建类型使用一个运行时库：

::: code-group

```CMake [静态]
set_property(TARGET MyTarget PROPERTY
    MSVC_RUNTIME_LIBRARY "MultiThreaded")
```

```CMake [动态]
set_property(TARGET MyTarget PROPERTY
    MSVC_RUNTIME_LIBRARY "MultiThreadedDLL")
```

:::

## Windows 上的 Clang

> [!IMPORTANT]
> **重要提示**：某些模组平台，例如 [Amethyst](https://github.com/FrederoxDev/Amethyst)，不支持 Clang。

Clang 编译器支持与 MSVC 的 [ABI 兼容性](https://clang.llvm.org/docs/MSVCCompatibility.html)。虽然它并非完全兼容，但其状态对于大多数应用程序（包括为 Minecraft: 基岩版开发模组）来说是可以接受的。

最好通过 `clang-cl.exe` 驱动程序来完成，它是 MSVC 的 `cl.exe` 的“直接替代品”。

### 不兼容性

使用 Clang 而不是 MSVC 时遇到的一个常见问题是与 `entt::type_hash` 的不兼容性。要解决此问题，请参阅 [类型哈希](/advanced-topics/entt.html#type-hashes)。

### 下载 LLVM

打开 Visual Studio Installer，然后在你的安装上选择“修改”。

![vs installer modify](/advanced-topics/configuring-your-compiler/vs-installer-modify.png)
*VS 安装程序修改*

点击顶部的“单个组件”，然后搜索“LLVM”。确保同时选中“用于 Windows 的 C++ Clang 编译器”和“LLVM 的 MSBuild 支持”。

![vs installer llvm](/advanced-topics/configuring-your-compiler/vs-installer-llvm.png)
*VS 安装程序 LLVM*

点击右下角的“修改”，等待安装完成。

![vs installer finish](/advanced-topics/configuring-your-compiler/vs-installer-finish.png)
*VS 安装程序完成*

### Visual Studio + MSBuild

打开 Microsoft Visual Studio，导航到 `项目 > [你的项目名称] 属性`

![vs project properties](/advanced-topics/configuring-your-compiler/vs-project-properties.png)
*VS 项目属性*

从“平台工具集”下拉菜单中选择“LLVM (clang-cl)”。

![vs platform toolset](/advanced-topics/configuring-your-compiler/vs-properties-toolset.png)
*VS 平台工具集*

### Visual Studio + CMake

点击构建类型下拉菜单下的“管理配置”。

![vs manage configurations](/advanced-topics/configuring-your-compiler/vs-manage-configurations.png)
*VS 管理配置*

为所需的构建配置选择 `clang_cl_x64`。

![vs configurations toolset](/advanced-topics/configuring-your-compiler/vs-configurations-toolset.png)
*VS 配置工具集*

### CLion

通过 `文件 > 设置` 或使用 `Ctrl+Alt+S` 打开 IDE 设置。

![open settings](/advanced-topics/configuring-your-compiler/clion-open-settings.png)
*打开设置*

导航到 `构建、执行、部署 > 工具链` 并添加一个新的“Visual Studio”工具链。

![new toolchain](/advanced-topics/configuring-your-compiler/clion-new-toolchain.png)
*新工具链*

将“架构”字段设置为 `amd64`，并将 C 和 C++ 编译器路径设置为
<br>`[VS 安装目录]\VC\Tools\Llvm\x64\bin\clang-cl.exe`。

![compiler path](/advanced-topics/configuring-your-compiler/clion-compiler-path.png)
*编译器路径*

导航到 `构建、执行、部署 > CMake`，并在相关的 CMake 配置文件中将工具链设置为我们刚刚创建的 Clang-Cl 工具链。

![profile toolchain](/advanced-topics/configuring-your-compiler/clion-profile-toolchain.png)
*配置文件工具链*
