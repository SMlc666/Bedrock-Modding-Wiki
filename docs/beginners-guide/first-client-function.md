
# 在客户端上找到你的第一个函数

本指南旨在为初学者介绍如何使用 IDA 在客户端上查找函数，在客户端上通常没有符号信息。要学习本指南，你需要已经分析过 `Windows Client` 和 `Windows BDS`，或者为了节省时间，你可以从[这里](https://www.mediafire.com/folder/ammda8wfvbw9x/The_Flopper_Databases)下载预先分析好的版本。

## 导航 IDA

在 BDS 的数据库中，我们将导航到函数 `Item::Item`。为此，首先在函数列表中右键单击并点击 `Modify Filters`（修改过滤器）。

![modify filters option](/beginners-guide/first-client-function/modify-filters.png)
（修改过滤器选项）

启用 `Regular Expression`（正则表达式）选项，输入 `^Item::`，然后点击 `add`（添加）。这将找到所有在 `Item` 类中的函数。

![filtering for item](/beginners-guide/first-client-function/item-filter.png)
（为物品过滤）

关闭过滤器窗口，并在函数列表中找到 `Item::Item`，双击它。这将带你到一个 `IDA View` 窗口中的函数，该窗口显示函数的汇编代码。为了使其更易于理解，我们可以反汇编该函数，方法是在 `IDA View` 窗口中选中该函数的同时按下 `F5`。

## 寻找可识别的信息

在伪代码窗口中，我们可以识别有关此函数的一些信息。我们首先可以看到函数定义本身 `_QWORD *__fastcall Item::Item(_QWORD *a1, _QWORD *a2, __int16 a3)`，我们可以看到它接受 3 个参数。

在伪代码窗口中向下滚动，我们还可以看到此函数使用了两个字符串 `atlas.items` 和 `minecraft`。

![strings in item](/beginners-guide/first-client-function/item-ctor-strings.png)
（物品中的字符串）

## 在客户端上查找函数

在另一个 IDA 实例中打开你的客户端数据库，我们可以搜索字符串以及它们的使用位置。为此，在屏幕顶部的 `Search`（搜索）下，点击 `Sequence of bytes...`（字节序列...）。在窗口中输入 `"atlas.items"`，保留默认选项，然后点击 OK。在列表中，应该只有一个结果，所以双击它。接下来，将鼠标悬停在字符串名称 `aAtlasItem` 上并按下 `X`，这将弹出一个 "xrefs"（交叉引用）列表，这是一个使用此字符串的函数列表。

![opening xrefs for atlas.items](/beginners-guide/first-client-function/atlas-item-strings-client.png)
（为 atlas.items 打开交叉引用）

当在 bds 上搜索字符串 `atlas.items` 时，我们可以看到该字符串仅被 Item 构造函数引用一次。

![bds xrefs for atlas.items](/beginners-guide/first-client-function/atlas-item-strings-bds.png)
（bds 中 atlas.items 的交叉引用）

这与客户端不同，在客户端中，该字符串被引用了 6 次。交叉引用数量的差异可能是由于某些函数仅存在于客户端上，因此不在服务器上。

## 识别哪些函数不是

查看客户端上字符串的交叉引用列表，我们可以立即排除前 3 个交叉引用，因为它们都是同一个函数，正如我们之前所知，Item 构造函数仅引用该字符串一次。查看交叉引用列表时，我们只需要查看函数名称，而无需查看 `+` 或 `:` 之后的信息，因为这只是说明它在函数中的使用位置。

![what to look at](/beginners-guide/first-client-function/xrefs-what-to-lookat.png)
（看什么）

这为我们留下了正好三个可能的函数，它们可能是客户端上的 `Item::Item`。由于我们需要检查的函数数量很少，我们可以单独查看每个函数，看看是否可以排除它们。我们可以通过双击函数来导航到该函数，然后通过按 `F5` 进入伪代码窗口。

从上到下搜索：

- 我们可以排除三个候选函数中的第一个，因为我们可以看到它使用了字符串 `"textures/particle/particles"`，而 item 构造函数没有使用该字符串。

- 我们也可以出于同样的原因排除三个候选函数中的第二个，因为它使用了字符串 `"textures/items/recovery_compass_atlas"`。

这为我们留下了一个函数，它可能是，因此我们现在已经在客户端上找到了构造函数！在最后一个函数的伪代码窗口中，我们还可以看到此函数的参数也对齐了 `_QWORD *__fastcall sub_1429DA770(__int64 a1, _QWORD *a2, __int16 a3)`

## 标记函数

现在我们已经在客户端上找到了 Item 类的构造函数，我们可以从 BDS 复制它的符号。在 BDS 上函数的伪代码窗口中，单击名称并按 `n` 并复制其现有名称。接下来，在客户端的伪代码中，再次在名称上按 `n`，并粘贴该符号 `??0Item@@QEAA@AEBV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@F@Z`$char_traits@D@std@@V?$allocator@D@2@@std@@F@Z`
