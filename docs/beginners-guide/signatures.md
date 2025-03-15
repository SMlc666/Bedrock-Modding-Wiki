# 签名（Signatures）

要从模块中识别特定函数，我们可以使用一种称为**签名（Signature）**的技术。函数的签名是通过分析函数的字节码，找到一段完全唯一于该函数的字节序列生成的。幸运的是，我们无需手动查看字节码，而是可以通过IDA（反汇编工具）中的**签名生成插件**自动完成这一过程。

通常情况下，IDA的默认安装会包含此插件。如果未找到，可从此处下载：[IDA-Pro-SigMaker](https://github.com/A200K/IDA-Pro-SigMaker)。

---

### 生成签名步骤

> [!重要提示]
> 在伪代码窗口中，请确保光标选中函数名称。这是为了确保我们从函数起始位置提取签名。

![](/beginners-guide/signatures/cursor-on-start.png)

1. 按下快捷键 `Ctrl + Alt + S`，或通过菜单栏选择 `Edit > Plugins > Signature Maker`。
2. 保持默认选项（如下图所示），直接点击 `OK`。

![](/beginners-guide/signatures/signature-maker-options.png)

3. 完成后，在 `Output` 窗口中会显示生成的签名，直接复制即可使用。

![](/beginners-guide/signatures/signature-output.png)

---

### 为何使用签名？

签名的核心优势在于**跨版本稳定性**。只要函数本身未被修改，同一签名可在游戏的不同版本中持续定位目标函数。相比硬编码地址（地址随版本更新必然变化），签名大幅降低了维护成本。

---

### 何时应避免使用签名？

当多个函数结构高度相似时，签名可能失效。例如以下两个函数：

```c++
void functionA(int a) {
    return a + a + 5;
}

void functionB(int b) {
    return b + b + 6;
}
```

它们的字节码差异极小，生成签名时会因特征重叠导致签名长度急剧膨胀（甚至超过1000字节）。此时，使用硬编码地址反而更高效，因为过长的签名会降低可维护性。

---

### 总结
- **适用场景**：函数逻辑稳定、跨版本需定位时。
- **不适用场景**：函数结构高度相似或频繁变动时。with.
