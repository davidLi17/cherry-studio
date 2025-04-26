import { nanoid } from '@reduxjs/toolkit' // 从 @reduxjs/toolkit 库中导入 nanoid 函数，用于生成唯一标识符
import { WebSearchState } from '@renderer/store/websearch' // 从 @renderer/store/websearch 中导入 WebSearchState 类型，表示搜索状态
import { WebSearchProvider, WebSearchResponse, WebSearchResult } from '@renderer/types' // 从 @renderer/types 中导入相关类型
import { fetchWebContent, noContent } from '@renderer/utils/fetch' // 从 @renderer/utils/fetch 中导入 fetchWebContent 函数和 noContent 常量

import BaseWebSearchProvider from './BaseWebSearchProvider' // 导入基类 BaseWebSearchProvider

// 定义 SearchItem 接口，表示搜索结果项
export interface SearchItem {
  title: string // 搜索结果标题
  url: string // 搜索结果链接
}

// 定义 LocalSearchProvider 类，继承自 BaseWebSearchProvider
export default class LocalSearchProvider extends BaseWebSearchProvider {
  // 构造函数，接收一个 WebSearchProvider 对象
  constructor(provider: WebSearchProvider) {
    // 检查 provider 是否存在以及 provider.url 是否存在
    if (!provider || !provider.url) {
      throw new Error('Provider URL is required') // 如果不存在，抛出错误
    }
    super(provider) // 调用基类的构造函数
  }

  // 定义 search 方法，用于执行搜索
  public async search(query: string, websearch: WebSearchState): Promise<WebSearchResponse> {
    const uid = nanoid() // 生成一个唯一标识符
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty') // 如果查询字符串为空，抛出错误
      }
      if (!this.provider.url) {
        throw new Error('Provider URL is required') // 如果 provider.url 不存在，抛出错误
      }

      const cleanedQuery = query.split('\r\n')[1] ?? query // 清理查询字符串，去除换行符
      const url = this.provider.url.replace('%s', encodeURIComponent(cleanedQuery)) // 替换 URL 中的占位符
      const content = await window.api.searchService.openUrlInSearchWindow(uid, url) // 在搜索窗口中打开 URL 并获取内容

      // 解析内容以提取 URL 和元数据
      const searchItems = this.parseValidUrls(content).slice(0, websearch.maxResults) // 解析有效 URL 并限制结果数量

      const validItems = searchItems
        .filter((item) => item.url.startsWith('http') || item.url.startsWith('https')) // 过滤出以 http 或 https 开头的 URL
        .slice(0, websearch.maxResults) // 再次限制结果数量
      // console.log('Valid search items:', validItems) // 打印有效搜索项（已注释）

      // 并发获取每个 URL 的内容
      const fetchPromises = validItems.map(async (item) => {
        // console.log(`Fetching content for ${item.url}...`) // 打印正在获取内容的 URL（已注释）
        const result = await fetchWebContent(item.url, 'markdown', this.provider.usingBrowser) // 获取内容
        if (websearch.contentLimit && result.content.length > websearch.contentLimit) {
          result.content = result.content.slice(0, websearch.contentLimit) + '...' // 如果内容超过限制，进行截断
        }
        return result
      })

      // 等待所有获取操作完成
      const results: WebSearchResult[] = await Promise.all(fetchPromises)

      return {
        query: query, // 返回原始查询字符串
        results: results.filter((result) => result.content != noContent) // 过滤掉没有内容的结果
      }
    } catch (error) {
      console.error('Local search failed:', error) // 打印错误信息
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`) // 抛出错误
    } finally {
      await window.api.searchService.closeSearchWindow(uid) // 关闭搜索窗口
    }
  }

  // 定义 parseValidUrls 方法，用于解析 HTML 内容并提取有效 URL
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parseValidUrls(_htmlContent: string): SearchItem[] {
    throw new Error('Not implemented') // 抛出未实现错误
  }
}
