// 引入国际化模块，用于处理多语言文本
import i18n from '@renderer/i18n'
// 引入状态管理模块，用于获取和更新应用状态
import store from '@renderer/store'
// 引入类型定义，用于指定Provider的类型
import { Provider } from '@renderer/types'

// 导出函数：根据ID获取提供商的名称
export function getProviderName(id: string) {
  // 从状态管理中获取当前所有提供商列表
  const provider = store.getState().llm.providers.find((p) => p.id === id)
  // 如果没有找到对应的提供商，返回空字符串
  if (!provider) {
    return ''
  }

  // 如果提供商是系统内置的
  if (provider.isSystem) {
    // 使用国际化模块翻译提供商名称，并设置默认值为提供商的原始名称
    return i18n.t(`provider.${provider.id}`, { defaultValue: provider.name })
  }

  // 如果提供商不是系统内置的，直接返回提供商的名称
  return provider?.name
}

// 导出函数：判断提供商是否支持认证
export function isProviderSupportAuth(provider: Provider) {
  // 定义一个支持认证的提供商列表
  const supportProviders = ['silicon', 'aihubmix']
  // 检查当前提供商是否在支持认证的列表中
  return supportProviders.includes(provider.id)
}

// 导出函数：判断提供商是否支持计费
export function isProviderSupportCharge(provider: Provider) {
  // 定义一个支持计费的提供商列表
  const supportProviders = ['silicon', 'aihubmix']
  // 检查当前提供商是否在支持计费的列表中
  return supportProviders.includes(provider.id)
}
