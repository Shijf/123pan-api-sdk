import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'API SDK',
  description: '123Pan 开放平台 Node.js SDK 文档',
  
  lang: 'zh-CN',
  
  // 使用自定义域名时，base 设置为 '/'
  base: '/',
  
  // 忽略死链接检查（本地开发链接和未完成的页面）
  ignoreDeadLinks: [
    // 忽略本地开发链接
    /^http:\/\/localhost/,
    // 忽略未完成的指南页面
    /\/guide\/error-handling/,
    /\/guide\/authentication/,
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'API 参考', link: '/api/' },
      { text: '示例', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/shijf/123pan-api-sdk' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '配置', link: '/guide/configuration' },
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '按需引入', link: '/guide/tree-shaking' },
          ]
        },
        {
          text: '其他',
          items: [
            { text: '版权声明', link: '/COPYRIGHT' },
          ]
        }
      ],
      '/examples/': [
        {
          text: '示例代码',
          items: [
            { text: '概览', link: '/examples/' },
            { text: '文件操作', link: '/examples/file' },
            { text: '图片处理', link: '/examples/image' },
            { text: '视频转码', link: '/examples/video' },
            { text: '离线下载', link: '/examples/offline' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
          ]
        },
        {
          text: '核心模块',
          items: [
            { text: 'SDK 主类', link: '/api/sdk' },
          ]
        },
        {
          text: '功能模块',
          items: [
            { text: '云盘管理', link: '/api/file' },
            { text: '用户', link: '/api/user' },
            { text: '离线下载', link: '/api/offline' },
            { text: '直链', link: '/api/direct-link' },
            { text: '图床', link: '/api/image' },
            { text: '视频转码', link: '/api/video' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shijf/123pan-api-sdk' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 | 本项目中使用的 123Pan Logo、品牌标识、相关图标及文字等知识产权归 123云盘官方所有，如有侵权请联系删除'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/shijf/123pan-api-sdk/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true
  }
})
