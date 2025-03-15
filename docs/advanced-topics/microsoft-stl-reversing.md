## Microsoft STL 逆向工程

## 类型识别

### `std::unique_ptr`

*声明：本节目前尚未完成，并且是从 EnTT 指南的[逆向成员](/advanced-topics/entt.html#reversing-members)部分分支出来的。*

以下是 Microsoft [STL](https://github.com/microsoft/STL/blob/8dc4faadafb52e3e0a627e046b41258032d9bc6a/stl/inc/memory#L3408) 实现中的相关代码片段，并添加了注释以进行澄清：
```C++
_CONSTEXPR23 ~unique_ptr() noexcept {
    // _Mypair 是一个由删除器函数和指向拥有对象的指针组成的 pair
    // (对于大小为 0 的删除器类型，不存储实际的删除器实例，只存储指向对象的指针)。

    // 此检查验证拥有的对象是否不为空
    if (_Mypair._Myval2) {
        // 此调用将指针
        // 传递给该对象的删除器函数。
        _Mypair._Get_first()(_Mypair._Myval2);
    }
}
```
但是为什么在 `pop_all` 伪代码中有一个额外的 `1i64` 参数呢？ 它实际上是 MSVC 编译器合成的 “vector deleting destructor”（向量删除析构函数）的结果。 此析构函数在虚函数表中的析构函数索引（最常见的是 0）处被引用。 以下是 `SimplePlayerContainer` 中的实现，它继承自 `SimpleContainer`：

![SimplePlayerContainer 析构函数](/advanced-topics/entt/SimplePlayerContainer-destructor.png)

`1i64` 的参数意味着 `std::_Return_temporary_buffer<unsigned int>` 被调用，而它又会调用 `operator delete`，这是销毁 `unique_ptr` 的最后一步。
