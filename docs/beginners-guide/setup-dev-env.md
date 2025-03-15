# 构建 Amethyst

本指南将帮助你在本地设置 [Amethyst](https://github.com/FrederoxDev/Amethyst)。开始之前，需要先进行一些准备工作。

- 首先你需要安装 [Visual Studio](https://visualstudio.microsoft.com/vs/community/)，下载最新版本，并在修改窗口中勾选 `使用 C++ 的桌面开发` 工作负载。

![](/beginners-guide/setup-dev-env/required_workloads.png)
（所需工作负载）

- 其次，你需要安装一个汇编编译器 [NASM](https://nasm.us/)，下载最新的稳定版本。你需要手动将 NASM 添加到你的路径环境变量中。默认安装目录为 `C:\Program Files\NASM`。

## 克隆和构建

在你选择的目录中运行 [git](https://git-scm.com/downloads) 命令，以在本地克隆 Amethyst 仓库：
```sh
git clone https://github.com/FrederoxDev/Amethyst.git
```

接下来，你需要创建一个名为 `amethyst_src` 的环境变量，指向此源代码目录。这将允许任何本地构建的 Mod 直接访问 AmethystAPI 的源文件。

![](/beginners-guide/setup-dev-env/amethyst_env.png)
（Amethyst 环境变量）

现在要构建 AmethystRuntime，打开 CMake-gui（这应该已随 Visual Studio 的 C++ 工作负载一起安装）。在第一个字段中输入 Amethyst 目录的路径，然后在第二个字段中输入相同的路径，并在末尾附加 `/build`。

![](/beginners-guide/setup-dev-env/amethyst_path.png)
（Amethyst 路径）

从这里开始，从左到右点击 cmake-gui 底部的三个按钮，保留所有默认选项。现在你将拥有 AmethystRuntime 的 `.sln` 文件，最后只需按 `Ctrl + Shift + B` 来构建项目。
