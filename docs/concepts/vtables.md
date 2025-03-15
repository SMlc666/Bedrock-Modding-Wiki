## 虚函数表 (Vtables)

> [!WARNING]
> 本文尚未完成，目前发布仅为收集反馈。如果您发现本文中有难以理解的部分，请在 Discord 上给我留言，指出哪些部分不清楚，以便我改进文章。

> [!INFO]
> 本文涵盖了一个通常在编程时无需考虑的主题，但在 Modding (模组制作) 中，理解 C++ 编译器如何在底层实现虚函数非常重要。

让我们从一些示例代码开始，其中我们有两个类，`class Cat` 继承自 `class Animal`。

```c++
class Animal {
public:
    virtual ~Animal() = default;

    virtual std::string getName() const {
        return "<unknown animal>";
    };

    virtual int getPopulation() const {
        return 0;
    }
};
```
```c++
class Cat : public Animal {
public:
    virtual ~Cat() = default;

    virtual std::string getName() const override {
        return "<cat>";
    }
};
```

请注意，在我们的基类 Animal 中，我们声明了一个虚函数 `getName`，它返回一个通用的字符串名称，而在我们的类 Cat 中，我们重写了这个函数以返回一个更具体的字符串。

## 为什么虚函数表 (vtables) 会存在？

假设我们想要为 `std::vector<std::shared_ptr<Animal>>` 中的每个元素调用 `getName` 函数，C++ 编译器如何知道每次应该调用哪个函数呢？

```c++
// 将 Animal 和 Cat 的实例添加到 vector 中
std::vector<std::shared_ptr<Animal>> animals = {};
animals.push_back(std::make_shared<Animal>());
animals.push_back(std::make_shared<Cat>());

// 对 vector 中的每个元素调用我们的 getName 函数
for (const auto& animal : animals) {
    Log::Info("name: '{}'", animal->getName());
}
```
```rs
[INFO] name: '<unknown animal>'
[INFO] name: '<cat>'
```

## 编译器如何知道要调用哪个函数？

为了实现这一点，C++ 编译器在类的开头添加了一个新的隐藏指针，该指针指向类的虚函数表，简称 vftable 或 vtable。在这个 vtable 内部，它包含了指向与该类关联的所有虚函数的指针：

```c++
struct Animal::vftable {
    void* destructor;    // Animal::~Animal();
    void* getName;       // Animal::getName();
    void* getPopulation; // Animal::getPopulation();
};
```
```c++
struct Cat::vftable {
    void* destructor;    // Cat::~Cat();
    void* getName;       // Cat::getName();
    void* getPopulation; // Animal::getPopulation();
};
```

- 首先要注意的是，这两个类的虚函数顺序完全相同。

- 然而，看看 `getName` 和析构函数，你会看到两者都包含指向该类特定函数实现的指针。

- 最后，看看 `getPopulation` 函数，你会注意到在两个 vtable 中，它仍然指向原始的 `Animal::getPopulation` 实现。这是因为在我们的类 Cat 中，我们没有重写这个函数，所以它使用了原始类中的那个实现。

## 隐藏的 vftable 指针
如前所述，一个隐藏的指针被放置在类的最开始位置，指向其 vtable。

```c++
class Animal {
public:
    Animal::vftable* vtbl; // <- 编译器生成的指向 vftable 的指针
                           //    正好放置在类的开头
                           //    在任何成员变量之前
}
```
```c++
class Cat : public Animal {
public:
    Cat::vftable* vtbl; // <- 注意指针已被替换为指向
                        //    Cat 拥有的 vftable 的指针
}
```

## 调用虚函数

因此，回到我们之前的例子，我们在 vector 中迭代每个 animal，在底层，它实际上更像是这样：

```c++
for (const auto& animal : animals) {
    Log::Info("name: '{}'", animal->vtbl->getName());
                                // ^ 在 vftable 内部找到函数指针并调用该函数，
                                //   而无需知道 animal 的实际类型是什么。
}
```

由于当我们继承一个类时，我们将 vtable 指针替换为指向新类的 vtable 的指针，这会自动处理切换调用哪个函数，而无需编译器知道 vector 中每个指针的类型。
