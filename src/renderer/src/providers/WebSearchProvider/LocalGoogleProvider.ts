import LocalSearchProvider, { SearchItem } from './LocalSearchProvider'

// 定义一个继承自LocalSearchProvider的类LocalGoogleProvider
export default class LocalGoogleProvider extends LocalSearchProvider {
  // 定义一个受保护的方法parseValidUrls，用于解析有效的URL
  // 参数htmlContent是待解析的HTML字符串
  // 返回一个SearchItem类型的数组
  protected parseValidUrls(htmlContent: string): SearchItem[] {
    // 初始化一个空数组用于存储解析后的结果
    const results: SearchItem[] = []

    try {
      // 创建一个DOMParser实例用于解析HTML字符串
      const parser = new DOMParser()
      // 将HTML字符串解析为一个DOM文档
      const doc = parser.parseFromString(htmlContent, 'text/html')

      // 使用querySelectorAll选择所有id为'search'的元素下的类名为'MjjYud'的元素
      const items = doc.querySelectorAll('#search .MjjYud')
      // 遍历每个元素
      items.forEach((item) => {
        // 获取元素中的<h3>标签
        const title = item.querySelector('h3')
        // 获取元素中的<a>标签
        const link = item.querySelector('a')
        // 如果标题和链接都存在
        if (title && link) {
          // 将标题和链接推入结果数组
          results.push({
            title: title.textContent || '', // 获取标题文本内容，如果没有则为空字符串
            url: link.href // 获取链接的href属性
          })
        }
      })
    } catch (error) {
      // 如果解析过程中出现错误，打印错误信息
      console.error('Failed to parse Google search HTML:', error)
    }
    // 返回解析后的结果数组
    return results
  }
}
