## 签名

为了从模组中识别一个函数，我们可以使用一种叫做**签名**的东西。一个函数的签名是通过查看该函数的字节码，并找到一段对该函数来说是独一无二的字节序列来生成的。幸运的是，我们不需要自己查看函数的字节码，而是可以使用IDA中的签名生成器插件。

签名生成器插件通常会随你的IDA安装一起提供，但如果你的IDA没有这个插件，你可以从[这里](https://github.com/A200K/IDA-Pro-SigMaker)获取。

### 生成签名

> [!IMPORTANT]
> 在伪代码窗口中，请确保你的光标选中在函数名上。 务必确保你在函数的开头生成签名，这一点非常重要。

![](/concepts/signatures/cursor-on-start.png)

接下来，按下组合键 `Ctrl + Alt + S` 或点击 `Edit > Plugins > Signature Maker`，并保留提供的默认选项，如下图所示。

![](/concepts/signatures/signature-maker-options.png)

最后，点击 `OK`。然后查找 `Output` 窗口，该函数的签名应该会打印在其中。 从这里简单地复制你的签名，就完成了！

![](/concepts/signatures/signature-output.png)

### 为什么要使用签名？

签名非常有用，因为它们可以跨多个版本识别相同的函数，前提是该函数本身在两个版本之间没有被修改。 正因如此，签名比使用硬编码地址要好得多，因为硬编码地址总是会在版本之间失效。

### 何时不应该使用签名？

考虑以下示例，你有函数A和函数B，这两个函数非常相似：

```c++
void functionA(int a) {
    return a + a + 5;
}

void functionB(int b) {
    return b + b + 6;
}
```

在这种情况下，这两个函数通常会具有几乎相同的签名，这意味着第一个独特的字节可能在函数内部的第1000个字节之后。 通常，这是一个使用硬编码地址的好情况，因为如此大的签名使用起来会很笨拙。  return b + b + 6;
}
```

In this scenario, it is common for the two functions to have nearly identical signatures, meaning the first unique could be 1000s of bytes into the function. Generally, this is a good scenario to use a hardcoded address, since a signature of that size is awkward to work with.
