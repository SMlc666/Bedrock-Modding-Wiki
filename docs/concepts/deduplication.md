## 代码去重

> [!INFO]
> 本文介绍的是代码去重，这个主题是 MSVC 编译器特有的，并非 Mojang 使用的其他编译器所具备的特性。这意味着这个主题仅影响游戏的 **Windows** 构建版本。

代码去重是指编译器将两个 **完全相同** 的函数合并成一个共享函数。以下面的例子为例，我们有两个函数：
```c++
struct StructA {
    /** this + 0 */ uint32_t mFoo; // mFoo 成员变量，偏移量为 0
    /** this + 4 */ uint32_t mBar; // mBar 成员变量，偏移量为 4
    /** this + 8 */ std::string mImportantInfo; // mImportantInfo 成员变量，偏移量为 8
};

const std::string& FunctionA(StructA& v) {
    return v.mImportantInfo;
}
```
```c++
struct StructB {
    /** this + 0 */ uint64_t mBaz; // mBaz 成员变量，偏移量为 0
    /** this + 8 */ uint64_t mData; // mData 成员变量，偏移量为 8
};

const uint64_t& FunctionB(StructB& v) {
    return v.mData;
}
```

虽然不完全明显，但这两个函数在汇编层面是完全相同的。让我们在一个名为 Godbolt 的在线编译器中查看一下。这个编译器允许我们直接查看编译这两个函数后的汇编代码输出。

![](/concepts/deduplication/godbolt_identical_asm.png)

### 为什么代码去重会生效？

- 首先，这两个函数都接受 1 个参数，并且都是引用类型。这一点很重要，因为引用类型在字节大小上始终相同，所以无论底层类型的大小如何，每个参数使用的寄存器都将是相同的。

- 接下来，这两个函数都访问了一个成员变量，该成员变量相对于传入的引用参数的偏移量为 8 字节。

- 最后，这两个函数都返回对该成员变量的引用（同样，引用类型的大小始终相同）。

由于这两个函数的汇编代码是完全相同的，编译器可以通过将它们合并为一个来节省文件空间。

## 代码去重对 Modding 的影响？

### Hooking 的局限性：

在我们需要修改一个函数但不修改另一个函数的情况下，代码去重可能会带来不利影响。假设我们想要 hook 上面例子中提供的 `FunctionA`，由于它们是相同的，因此它们被合并为一个函数。这意味着如果我们修改 `FunctionA`，这将无意中产生修改 `FunctionB` 的副作用，但这可能不是 modder 所期望的。

### IDA 和其他逆向工程工具的局限性：

当两个函数被合并为一个时，这意味着在调试信息中，一个地址可能与多个符号关联。像 IDA 这样的工具通常只能为一个地址显示一个关联的符号。例如，当查看虚函数表 (vtable) 中虚函数的顺序时，这可能会成为一个问题，IDA 会重复显示一个符号，而不是该地址上函数的真实符号（如果函数没有被合并的话）。

![](/concepts/deduplication/repeated_symbols.png)

上面展示了 Item 的虚函数表 (vtable)，其中一个看似不相关的符号 `JsonDefinitionSerializer` 被重复显示了很多次。查看这个函数的内部，很明显编译器为什么能够如此频繁地重用这个函数，因为它是一个单行函数 `return false;`

![](/concepts/deduplication/deduplicated_code.png)ng)
