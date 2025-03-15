# EnTT

## 简介

[EnTT](https://github.com/skypjack/entt) 是 Minecraft: 基岩版 使用的 [面向数据](https://en.wikipedia.org/wiki/Data-oriented_design) 的实体组件系统 (ECS)。它用于存储实体的通用数据，例如位置和碰撞箱，这些数据存储在称为组件的离散结构中。

随着每个版本发布，越来越多的 `Actor` 数据从类成员转移到专用组件；幸运的是，EnTT 使我们能够快速响应这些更改并保持与最新 Minecraft 版本的兼容性。

有关 EnTT 的更多信息，请查看由其 [维护者](https://github.com/skypjack) 编写的、信息量大且全面的 [wiki](https://github.com/skypjack/entt/wiki)。

## 选择版本

您的 Minecraft 版本所需的 EnTT 具体版本会有所不同：

| MC:BE 版本         | EnTT 标签  | EnTT Commit 哈希值                         |
|:-------------------|:-----------|:--------------------------------------------|
| `1.21.0+`           | N/A        | `f931687ff04d435871ac9664bb299f71f2a8fafc` |
| `1.20.70-1.20.8x`  | `v3.13.1`  | `2909e7ab1f1e73a36f778319070695611e3fa47b` |
| `1.20.50-1.20.6x`  | N/A        | `62a13526c989f14eff348c28c061542ac7a16d45` |
| `1.20.4x`           | N/A        | `717897052477515260bde3fd21fe987662666621` |

## 包含 EnTT

*本指南仅介绍基于 CMake 的项目如何包含 EnTT。*

CMake 的 [FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html) 模块可用于从 git commit 哈希值或标签下载并包含 EnTT 的 CMake 项目：
```CMake
include(FetchContent)

FetchContent_Declare(
  EnTT
  GIT_REPOSITORY https://github.com/skypjack/entt.git
  GIT_TAG        2909e7ab1f1e73a36f778319070695611e3fa47b # v3.13.1
)

FetchContent_MakeAvailable(EnTT)
target_link_libraries(MyTarget PRIVATE EnTT::EnTT)
```

或者，如果您的环境中配置了软件包仓库，则可以使用 `find_package` 作为不太冗长的选项。但是，只有发布到仓库的官方版本才可用，不一定是特定的 commit。
```CMake
find_package(EnTT 3.13.1 CONFIG REQUIRED)
target_link_libraries(MyTarget PRIVATE EnTT::EnTT)
```

## 配置

Mojang 以多种方式配置了 EnTT，以满足 Minecraft: 基岩版的需要。为了使您的 Mod 与 Minecraft 具有二进制兼容性并避免运行时错误，EnTT 的配置必须完全匹配。

第一步是定义自定义实体标识符类型：

```C++
struct EntityId {
    std::uint32_t rawId;

    [[nodiscard]] constexpr bool operator==(const EntityId& other) const = default;

    [[nodiscard]] constexpr operator std::uint32_t() const {
        return this->rawId;
    }
};
```

为了将自定义标识符类型与 EnTT 一起使用，必须定义 `entt::entt_traits` 特化（以下所有数值都特定于 Mojang 的 EnTT 特化，并通过逆向工程提取）：

```C++
struct EntityIdTraits {
    using value_type = EntityId;

    using entity_type = std::uint32_t;
    using version_type = std::uint16_t;

    static constexpr entity_type entity_mask = 0x3FFFF; // raw id 的低 18 位
    static constexpr entity_type version_mask = 0x3FFF; // raw id 的高 14 位
};
```
```C++
template<>
struct entt::entt_traits<EntityId> : entt::basic_entt_traits<EntityIdTraits> {
    static constexpr std::size_t page_size = 2048;
};
```

接下来，必须配置组件存储。下面演示的方法是通过创建一个所有组件都将从中派生的基类，然后为该基类的派生类特化 `entt::component_traits`。

```C++
struct IEntityComponent {};

template<std::derived_from<IEntityComponent> Type>
struct entt::component_traits<Type> {
    using type = Type;
    static constexpr bool in_place_delete = true;
    static constexpr std::size_t page_size = 128 * !std::is_empty_v<Type>;
};
```

最后，必须为 `EntityId` 派生的存储类型禁用 [信号处理程序](https://github.com/skypjack/entt/wiki/Crash-Course:-entity-component-system#observe-changes)，这通过特化 `entt::storage_type` 来完成，并且不将 `entt::basic_storage` 包装在 `entt::sigh_mixin` 中（就像默认特化所做的那样）。

```C++
template<typename Type>
struct entt::storage_type<Type, EntityId> {
    using type = basic_storage<Type, EntityId>;
};
```

现在您已经为 EnTT 配置了适当的环境，该环境与 Minecraft: 基岩版 [ABI](https://en.wikipedia.org/wiki/Application_binary_interface) 兼容。

> [!IMPORTANT]
> 您代码中 EnTT 的所有用法都需要能够访问上面提供的特化。保证这一点的简单方法是将特化放在定义 `EntityId` 的同一个头文件中，因为其他所有内容都将依赖于它。

## 定义组件

定义组件时，有几个关键事项必须与游戏匹配：

1. 类型名称
2. 类型的类/结构体指定
3. 类型大小
4. 类型的哈希值

### 匹配声明

组件名称及其类/结构体指定很容易找到。EnTT 在所有 Minecraft: 基岩版 二进制文件中都留下了字符串，作为存储在所有组件的静态 `entt::type_info<T>` 实例中的类型名称的一部分；但是，只有使用 MSVC 编译的 Windows 二进制文件才会包含类/结构体指定：

![二进制字符串中的类型名称](/advanced-topics/entt/stripped_type_name.png)

> [!TIP]
> 大多数实体组件都是 `struct` 类型。一些值得注意的 `class` 异常是 `ActorOwnerComponent` 和 `FlagComponent`。

在本指南中，我们将研究 `ActorEquipmentComponent`。回顾包含所有类型名称的屏幕截图，我们可以开始定义：

```C++
struct ActorEquipmentComponent : IEntityComponent {};
```

### 查找大小

有多种方法可以通过 IDA 查找组件的大小。使用的确切方法将取决于组件，但最简单的方法是找到 `entt::basic_registry<EntityId>::try_get<T>(EntityId)` 的代码生成。

有时，`try_get<T>` 将完全内联到 `Actor::tryGetComponent<T>` 中：

![Actor::tryGetComponent<T>](/advanced-topics/entt/tryGetComponent.png)

其他时候，实际的 `try_get<T>` 函数将可用：

![entt::basic_registry<EntityId>::try_get<T>](/advanced-topics/entt/try_get.png)

如果其中任何一个可用，则在将函数反编译为伪代码时，大小立即可用。对于 `ActorEquipmentComponent`，它是 `16 (0x10)` 字节：

![entt::basic_registry<EntityId>::try_get<T>](/advanced-topics/entt/size-from-try_get.png)

这种简单的方法并非适用于所有组件，因为它依赖于编译器不内联 `try_get` 实现。幸运的是，确实存在一个万无一失的解决方案：为每个组件创建一个 `entt::basic_storage<T, EntityId>` 虚函数表。

![entt::basic_storage<T, EntityId>::`vftable'](/advanced-topics/entt/basic_storage-vtable.png)

通过跟踪从 `entt::basic_storage<T, EntityId>::try_emplace` 的函数调用，我们最终可以在伪代码中清楚地看到组件的大小：

![entt::basic_storage<T, EntityId>::try_emplace](/advanced-topics/entt/basic_storage-try_emplace.png)

然后到 `entt::basic_storage<T, EntityId>::emplace_element`：

![entt::basic_storage<T, EntityId>::emplace_element](/advanced-topics/entt/basic_storage-emplace_element.png)

最后到 `entt::basic_storage<T, EntityId>::assure_at_least`：

![entt::basic_storage<T, EntityId>::assure_at_least](/advanced-topics/entt/basic_storage-assure_at_least.png)

组件的大小可以通过查看应用于 `(vN & 0x7F)` 项的比例来以与之前相同的方式识别。这与之前的 `16` 字节结果相符。

### 逆向成员

现在我们有了组件的大小，我们可以像这样填充定义：
```C++
struct ActorEquipmentComponent : IEntityComponent {
    std::byte pad[0x10];
};
static_assert(sizeof(ActorEquipmentComponent) == 0x10);
```

> [!TIP]
> 使用 `static_assert` 验证组件的已知大小可以将潜在的运行时错误转换为编译时错误。

下一个合乎逻辑的步骤是找出这 16 个字节实际包含什么。根据组件的不同，这可能非常繁琐，但一个可靠的起点是检查 `try_get` 的用法。

![try_get 用法](/advanced-topics/entt/try_get-xrefs.png)

第一个用法提供了一些见解，反编译伪代码中的第 14 行包含在一个对象上执行的虚函数调用，该对象的地址存储在组件中的偏移量 8 处。

![getAllArmor](/advanced-topics/entt/xref-getAllArmor.png)

让我们根据我们的发现更新结构体：

```C++
struct ActorEquipmentComponent : IEntityComponent {
    std::byte pad[0x8];
    void* ptrToUnknownVirtualType;
};
```

下一个用法提供了一些更多的见解，它告诉我们未知的虚类型实际上是 `SimpleContainer`：

![getArmorContainer](/advanced-topics/entt/xref-getArmorContainer.png)

```C++
struct ActorEquipmentComponent : IEntityComponent {
    std::byte pad[0x8];
    SimpleContainer* armorContainer;
};
```

下一个用法证实了关于存储在组件偏移量 0 处的数据的相同信息：它是指向 `SimpleContainer` 的另一个指针：

![getHandContainer](/advanced-topics/entt/xref-getHandContainer.png)

```C++
struct ActorEquipmentComponent : IEntityComponent {
    SimpleContainer* handContainer;
    SimpleContainer* armorContainer;
};
```

就这样了吗？嗯，不一定。实体组件旨在成为拥有类型（它们负责其成员的生命周期），而原始指针并不表示任何关于所有权的信息。此外，合法的原始指针在 Minecraft: 基岩版 中并不常见。

> [!TIP]
> 查看对象的销毁方式可以直接了解其数据成员的所有权模型。

回顾前面提到的 `entt::basic_storage<T, EntityId>` vtable，我们可以查看 `pop_all` 虚成员函数，以了解组件是如何销毁的：

![entt::basic_storage<T, EntityId>::pop_all](/advanced-topics/entt/basic_storage-pop_all.png)

如果您不熟悉针对 Microsoft STL 编译的 Windows C++ 应用程序的逆向工程，这可能看起来并不重要。但是，它实际上表明了指向虚类型的 `std::unique_ptr`（有关更多信息，请[继续阅读](/advanced-topics/microsoft-stl-reversing.html#std-unique-ptr)）。

有了这些信息，可以完成 `ActorEquipmentComponent` 的定义：

```C++
struct ActorEquipmentComponent : IEntityComponent {
    std::unique_ptr<SimpleContainer> handContainer;
    std::unique_ptr<SimpleContainer> armorContainer;
};
```

### 类型哈希值

> [!NOTE]
> 如果您正在使用与您的 Mod 目标 Minecraft: 基岩版 平台关联的编译器，则本节中提供的信息并非至关重要。
>
> 有关您应该使用哪个编译器的更多信息，请[继续阅读](/advanced-topics/configuring-your-compiler.html#picking-a-compiler)。

`entt::registry` 为每种组件类型创建一个存储对象。为了在运行时检索存储实例，组件类型的哈希值用作 `map<type_hash, component_storage>` 的键。虽然类型的哈希值基于该类型的美化名称，但它不是可移植的。考虑以下示例：

```C++
template<typename T>
class FlagComponent : IEntityComponent {};

struct OnGroundFlag {};
```

| 编译器    | `entt::type_name<T>::value()`                 | `entt::type_hash<T>::value()` |
|:------------|:----------------------------------------------|:-------------------------------|
| MSVC        | `"class FlagComponent<struct OnGroundFlag>"`  | `0x211F2DE1`                   |
| GCC/Clang   | `"FlagComponent<OnGroundFlag>"`               | `0x062EEC98`                   |

如果您为给定的基岩平台使用推荐的编译器，则这种差异不是问题。但是，如果您在 Windows 上使用 [Clang](/advanced-topics/configuring-your-compiler.html#clang-on-windows)，则它会成为一个问题。无论您是否在 Microsoft 兼容模式下使用 Clang，它都会生成相同的类型哈希值。为了解决这个问题，我们可以特化 `entt::type_hash`。

有许多方法可以特化 `entt::type_hash` 以保持编译器之间的兼容性。本指南将专门针对在 Windows 上使用 Clang 开发基岩版 Mod 的解决方案。

在之前的示例的基础上，让我们为我们的类添加一些静态成员。为此，我们将使用 [libhat](https://github.com/BasedInc/libhat) 提供的 `fixed_string`：

```C++
template<typename T>
class FlagComponent : IEntityComponent {
public:
    static constexpr hat::fixed_string type_name
        = "class FlagComponent<" + T::type_name + ">";
};

struct OnGroundFlag {
    static constexpr hat::fixed_string type_name
        = "struct OnGroundFlag";
};
```

然后为从 `IEntityComponent` 派生的类型创建 `entt::type_hash` 特化：

```C++
template<std::derived_from<IEntityComponent> Type>
struct entt::type_hash<Type> {
    [[nodiscard]] static consteval id_type value() noexcept {
        constexpr auto name = Type::type_name;
        return hashed_string::value(name.data(), name.size());
    }

    [[nodiscard]] consteval operator id_type() const noexcept {
        return value();
    }
};
```

## 使用组件

### EntityContext

Minecraft 的 `EntityContext` 类封装了访问实体组件所需的必要状态。

::: code-group

```C++ [1.20.50+]
struct EntityRegistry : std::enable_shared_from_this<EntityRegistry> {
    std::string name;
    entt::basic_registry<EntityId> registry;
    uint32_t id;
};

struct EntityContext {
    EntityRegistry& registry;
    entt::basic_registry<EntityId>& enttRegistry;
    EntityId entity;
};
```

```C++ [1.20-1.20.41]
struct EntityRegistryBase {
    entt::basic_registry<EntityId>& registry;
    uint32_t id;
};

struct EntityRegistry : EntityRegistryBase, std::enable_shared_from_this<EntityRegistry> {
    std::string name;
    entt::basic_registry<EntityId> ownedRegistry;
};

struct EntityContextBase {
    EntityRegistryBase& registry;
    EntityId entity;
};

struct EntityContext : EntityContextBase {
    entt::basic_registry<EntityId>& getEnttRegistry() const {
        return static_cast<EntityRegistry&>(this->registry).ownedRegistry;
    }
};
```

:::

> [!NOTE]
> 为了简单起见，这些游戏类被表示为结构体，以暗示公共可见性。实际的类型指定和成员可见性可能与 Minecraft 的实际源代码有所不同。

从现在开始的示例将基于相关 Minecraft ABI 的最新修订版（目前为 1.20.50+）。如果您正在为不同的 Minecraft 版本开发，则可能需要进行细微的修改。

我们可以定义一些辅助函数来访问和修改组件：
```C++
struct EntityContext {
    // ... 省略字段 ...

    template<std::derived_from<IEntityComponent> T>
    [[nodiscard]] T* tryGetComponent() {
        return this->enttRegistry.try_get<T>(this->entity);
    }

    template<std::derived_from<IEntityComponent> T>
    [[nodiscard]] const T* tryGetComponent() const {
        return this->enttRegistry.try_get<T>(this->entity);
    }

    template<std::derived_from<IEntityComponent> T>
    [[nodiscard]] bool hasComponent() const {
        return this->enttRegistry.all_of<T>(this->entity);
    }

    template<std::derived_from<IEntityComponent> T>
    T& getOrAddComponent() {
        return this->enttRegistry.get_or_emplace<T>(this->entity);
    }

    template<std::derived_from<IEntityComponent> T>
    void removeComponent() {
        this->enttRegistry.remove<T>(this->entity);
    }
};
```

> [!WARNING]
> `getOrAddComponent` 和 `removeComponent` 都调用了 `entt::basic_registry<...>::assure<T>` 的非常量版本。如果在 Minecraft 创建组件 `T` 的存储之前调用了这些函数中的任何一个，则存储将由您的 Mod 创建。这带来的不良后果是，存储对象的虚函数表将位于您的 Mod 二进制文件的只读数据段中。在此之后卸载 Mod 将导致游戏崩溃。虽然有一些方法可以防止此错误，但本指南目前未解决这些方法。

### Actors

现在我们有了 `EntityContext` 的定义，我们需要能够访问 Actors 的实例。幸运的是，这是一项简单的任务：

```C++
class Actor {
public:
    /* this + 0x0 */ Actor_vtbl* __vftable; // 编译器生成
    /* this + 0x8 */ EntityContext entity;
    // ... 省略字段 ...
};
```

如果不想定义 `Actor` 的实际结构体，[libhat](https://github.com/BasedInc/libhat) 提供了 `hat::member_at`，这是一个用于从类数据偏移量访问成员的实用程序函数。

```C++
class Actor {
public:
    // 利用 C++23 的显式 this 对象参数
    // 以避免编写常量和非常量重载
    [[nodiscard]] auto& getEntity(this auto& self) {
        return hat::member_at<EntityContext>(&self, 0x8);
    }
};
```

现在，如果我们获得 `Actor` 的实例，例如客户端的本地玩家，访问组件就很简单了：

```C++
void onLevelTick() {
    auto& player = clientInstance->getLocalPlayer().getEntity();

    if (player.hasComponent<FlagComponent<OnGroundFlag>>()) {
        logToChat("玩家在地面上");
    }

    if (auto* svc = player.tryGetComponent<StateVectorComponent>(); svc) {
        logToChat("玩家在 {}", svc->pos);
    }
}
```
