import { WebSearchProvider } from '@renderer/types' // 从'renderer/types'模块导入WebSearchProvider类型

import BaseWebSearchProvider from './BaseWebSearchProvider' // 导入基础的网络搜索提供者类
import DefaultProvider from './DefaultProvider' // 导入默认的网络搜索提供者类
import ExaProvider from './ExaProvider' // 导入Exa网络搜索提供者类
import LocalBaiduProvider from './LocalBaiduProvider' // 导入本地百度搜索提供者类
import LocalBingProvider from './LocalBingProvider' // 导入本地必应搜索提供者类
import LocalGoogleProvider from './LocalGoogleProvider' // 导入本地谷歌搜索提供者类
import SearxngProvider from './SearxngProvider' // 导入Searxng搜索提供者类
import TavilyProvider from './TavilyProvider' // 导入Tavily搜索提供者类

// 导出一个名为WebSearchProviderFactory的类
export default class WebSearchProviderFactory {
  // 静态方法create，用于根据提供的搜索提供者类型创建相应的搜索提供者实例
  static create(provider: WebSearchProvider): BaseWebSearchProvider {
    // 使用switch语句根据provider.id来选择创建哪种类型的搜索提供者实例
    switch (provider.id) {
      case 'tavily': // 如果provider.id为'tavily'
        return new TavilyProvider(provider) // 创建并返回一个TavilyProvider实例
      case 'searxng': // 如果provider.id为'searxng'
        return new SearxngProvider(provider) // 创建并返回一个SearxngProvider实例
      case 'exa': // 如果provider.id为'exa'
        return new ExaProvider(provider) // 创建并返回一个ExaProvider实例
      case 'local-google': // 如果provider.id为'local-google'
        return new LocalGoogleProvider(provider) // 创建并返回一个LocalGoogleProvider实例
      case 'local-baidu': // 如果provider.id为'local-baidu'
        return new LocalBaiduProvider(provider) // 创建并返回一个LocalBaiduProvider实例
      case 'local-bing': // 如果provider.id为'local-bing'
        return new LocalBingProvider(provider) // 创建并返回一个LocalBingProvider实例
      default: // 如果provider.id不匹配以上任何一种情况
        return new DefaultProvider(provider) // 创建并返回一个默认的搜索提供者实例
    }
  }
}
