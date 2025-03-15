import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  "title": "Bedrock Modding Wiki",
  "description": "A wiki focused on reverse engineering and modding MCBE",
  "base": "/Bedrock-Modding-Wiki/",
  "themeConfig": {
    "nav": [
      { "text": '首页', "link": '/' },
      { "text": '新手指南', "link": '/beginners-guide/first-client-function' }
    ],
    "outline": {
      "level": [2, 3]
    },
    "sidebar": [
      {
        "text": '新手指南',
        "items": [
          { "text": '构建 Amethyst', "link": '/beginners-guide/setup-dev-env.md' },
          { "text": '找到你的第一个客户端函数', "link": '/beginners-guide/first-client-function' },
          { "text": '从虚函数表查找函数', "link": '/beginners-guide/functions-from-a-vtable' }
        ]
      },
      {
        "text": '概念',
        "items": [
          { "text": '虚函数表', "link": '/concepts/vtables.md' },
          { "text": '签名', "link": '/concepts/signatures.md' },
          { "text": '去重', "link": '/concepts/deduplication.md' }
        ]
      },
      {
        "text": '进阶主题',
        "items": [
          { "text": '配置你的编译器', "link": '/advanced-topics/configuring-your-compiler.md' },
          { "text": 'Microsoft STL 逆向工程', "link": '/advanced-topics/microsoft-stl-reversing.md' },
          { "text": 'EnTT', "link": '/advanced-topics/entt' }
        ]
      }
    ],
    "socialLinks": [
      { "icon": 'github', "link": 'https://github.com/frederoxDev/Bedrock-Modding-Wiki' }
    ],
    "search": {
      "provider": "local"
    }
  }
})
