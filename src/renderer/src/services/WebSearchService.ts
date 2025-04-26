import WebSearchEngineProvider from '@renderer/providers/WebSearchProvider' // 导入网络搜索引擎提供商
import store from '@renderer/store' // 导入全局状态管理库
import { setDefaultProvider, WebSearchState } from '@renderer/store/websearch' // 导入设置默认提供商和搜索状态的函数和类型
import { WebSearchProvider, WebSearchResponse, WebSearchResult } from '@renderer/types' // 导入网络搜索相关类型
import { hasObjectKey } from '@renderer/utils' // 导入检查对象键的工具函数
import { ExtractResults } from '@renderer/utils/extract' // 导入提取结果的类型
import { fetchWebContents } from '@renderer/utils/fetch' // 导入获取网页内容的工具函数
import dayjs from 'dayjs' // 导入日期处理库

/**
 * 提供网络搜索相关功能的服务类
 */
class WebSearchService {
  /**
   * 获取当前存储的网络搜索状态
   * @private
   * @returns 网络搜索状态
   */
  private getWebSearchState(): WebSearchState {
    return store.getState().websearch // 从全局状态中获取网络搜索状态
  }

  /**
   * 检查网络搜索功能是否启用
   * @public
   * @returns 如果默认搜索提供商已启用则返回true，否则返回false
   */
  public isWebSearchEnabled(): boolean {
    const { defaultProvider, providers } = this.getWebSearchState() // 获取默认提供商和所有提供商列表
    const provider = providers.find((provider) => provider.id === defaultProvider) // 找到默认提供商

    if (!provider) {
      return false // 如果没有找到默认提供商，返回false
    }

    if (provider.id.startsWith('local-')) {
      return true // 如果提供商ID以'local-'开头，表示本地搜索，返回true
    }

    if (hasObjectKey(provider, 'apiKey')) {
      return provider.apiKey !== '' // 如果提供商有apiKey且不为空，返回true
    }

    if (hasObjectKey(provider, 'apiHost')) {
      return provider.apiHost !== '' // 如果提供商有apiHost且不为空，返回true
    }

    return false // 其他情况返回false
  }

  /**
   * 检查是否启用覆盖搜索
   * @public
   * @returns 如果启用覆盖搜索则返回true，否则返回false
   */
  public isOverwriteEnabled(): boolean {
    const { overwrite } = this.getWebSearchState() // 获取覆盖搜索状态
    return overwrite // 返回覆盖搜索状态
  }

  /**
   * 获取当前默认的网络搜索提供商
   * @public
   * @returns 网络搜索提供商
   * @throws 如果找不到默认提供商则抛出错误
   */
  public getWebSearchProvider(): WebSearchProvider {
    const { defaultProvider, providers } = this.getWebSearchState() // 获取默认提供商和所有提供商列表
    let provider = providers.find((provider) => provider.id === defaultProvider) // 找到默认提供商

    if (!provider) {
      provider = providers[0] // 如果没有找到默认提供商，取第一个提供商
      if (provider) {
        // 可选：自动更新默认提供商
        store.dispatch(setDefaultProvider(provider.id)) // 更新默认提供商
      } else {
        throw new Error(`No web search providers available`) // 如果没有提供商可用，抛出错误
      }
    }

    return provider // 返回找到的提供商
  }

  /**
   * 使用指定的提供商执行网络搜索
   * @public
   * @param provider 搜索提供商
   * @param query 搜索查询
   * @returns 搜索响应
   */
  public async search(provider: WebSearchProvider, query: string): Promise<WebSearchResponse> {
    const websearch = this.getWebSearchState() // 获取当前网络搜索状态
    const webSearchEngine = new WebSearchEngineProvider(provider) // 创建一个新的搜索引擎实例

    let formattedQuery = query // 初始化格式化查询字符串
    // 有待商榷，效果一般
    if (websearch.searchWithTime) {
      formattedQuery = `today is ${dayjs().format('YYYY-MM-DD')} \r\n ${query}` // 如果需要带时间搜索，添加当前日期
    }

    try {
      return await webSearchEngine.search(formattedQuery, websearch) // 执行搜索并返回结果
    } catch (error) {
      console.error('Search failed:', error) // 搜索失败时打印错误
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`) // 抛出搜索失败错误
    }
  }

  /**
   * 检查搜索提供商是否正常工作
   * @public
   * @param provider 要检查的搜索提供商
   * @returns 如果提供商可用返回true，否则返回false
   */
  public async checkSearch(provider: WebSearchProvider): Promise<{ valid: boolean; error?: any }> {
    try {
      const response = await this.search(provider, 'test query') // 使用测试查询检查提供商
      console.log('Search response:', response) // 打印搜索响应
      // 优化的判断条件：检查结果是否有效且没有错误
      return { valid: response.results !== undefined, error: undefined } // 如果结果有效，返回true
    } catch (error) {
      return { valid: false, error } // 如果有错误，返回false和错误信息
    }
  }

  public async processWebsearch(
    webSearchProvider: WebSearchProvider,
    extractResults: ExtractResults
  ): Promise<WebSearchResponse> {
    try {
      // 检查 websearch 和 question 是否有效
      if (!extractResults.websearch?.question || extractResults.websearch.question.length === 0) {
        console.log('No valid question found in extractResults.websearch') // 如果没有有效问题，打印日志
        return { results: [] } // 返回空结果
      }

      const questions = extractResults.websearch.question // 获取问题列表
      const links = extractResults.websearch.links // 获取链接列表
      const firstQuestion = questions[0] // 获取第一个问题

      if (firstQuestion === 'summarize' && links && links.length > 0) {
        const contents = await fetchWebContents(links) // 如果第一个问题是总结且链接有效，获取网页内容
        return {
          query: 'summaries',
          results: contents // 返回总结结果
        }
      }
      const searchPromises = questions.map((q) => this.search(webSearchProvider, q)) // 对每个问题进行搜索
      const searchResults = await Promise.allSettled(searchPromises) // 等待所有搜索结果
      const aggregatedResults: WebSearchResult[] = [] // 初始化聚合结果数组

      searchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.results) {
            aggregatedResults.push(...result.value.results) // 如果搜索成功且有结果，添加到聚合结果中
          }
        }
      })
      return {
        query: questions.join(' | '), // 返回所有问题的联合查询字符串
        results: aggregatedResults // 返回聚合结果
      }
    } catch (error) {
      console.error('Failed to process enhanced search:', error) // 处理失败时打印错误
      return { results: [] } // 返回空结果
    }
  }
}

export default new WebSearchService() // 导出WebSearchService的实例
