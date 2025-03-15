# 通过虚函数表查找虚函数

对于客户端和服务器上都有的大多数类来说，识别大量函数的最简单方法之一是通过 "vftable / vtable"（虚函数表）。要使类中存在虚函数表，该类必须使用 `virtual` 函数。

在上一个指南中，我们识别了 `Item` 类的构造函数，我们可以使用它来轻松地在客户端上找到虚函数表。在构造函数中，传递给构造函数的第一个参数是指向 `this` 的指针。在 `Item::Item` 的参数中，`this` 参数是 `a1`：`Item *__fastcall Item::Item(__int64 a1, _QWORD *a2, __int16 a3)`。

对于仅从一个类或不从任何类继承的类，虚函数表地址将存储在相对于 `this` 指针偏移量为 0 的位置。因此，要查找该类的虚函数表，我们可以查找行 `*a1 = &off_1453C9B70;`。

![bds xrefs for atlas.items](/beginners-guide/functions-from-a-vtable/vtable_offset.png)
（虚函数表偏移量）

如果我们也在服务器上打开虚函数表，我们可以直接将函数的顺序从 bds 直接复制到客户端。在红色标记中，标记了函数的索引。通常，在虚函数表的索引 0 处，你将拥有该类的析构函数，然后是该类其余的虚函数。

![vfuncs on bds](/beginners-guide/functions-from-a-vtable/vtable_order.png)
（bds 上的虚函数）

因此，例如：如果我们想在客户端上找到 `Item::initServer` 函数，我们可以查看它在 bds 虚函数表中的位置（索引 1），并在客户端上相同的位置命名该函数。

![labeling a vfunc](/beginners-guide/functions-from-a-vtable/labeled_vfunc.png)
（标记虚函数）
