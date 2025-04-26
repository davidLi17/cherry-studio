// 导入数据库模块
import db from '@renderer/databases'
// 导入国际化模块
import i18n from '@renderer/i18n'
// 导入状态管理模块
import store from '@renderer/store'
// 导入文件类型定义
import { FileType } from '@renderer/types'
// 导入获取文件目录的工具函数
import { getFileDirectory } from '@renderer/utils'
// 导入日期处理库
import dayjs from 'dayjs'

// 文件管理类
class FileManager {
  // 静态方法：选择文件
  static async selectFiles(options?: Electron.OpenDialogOptions): Promise<FileType[] | null> {
    // 调用API选择文件
    const files = await window.api.file.select(options)
    // 返回选择的文件
    return files
  }

  // 静态方法：添加单个文件
  static async addFile(file: FileType): Promise<FileType> {
    // 从数据库获取文件记录
    const fileRecord = await db.files.get(file.id)

    // 如果文件记录存在，更新文件计数
    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    // 如果文件记录不存在，添加新文件
    await db.files.add(file)

    // 返回文件对象
    return file
  }

  // 静态方法：批量添加文件
  static async addFiles(files: FileType[]): Promise<FileType[]> {
    // 使用Promise.all并行处理所有文件的添加
    return Promise.all(files.map((file) => this.addFile(file)))
  }

  // 静态方法：读取文件内容
  static async readFile(file: FileType): Promise<Buffer> {
    // 调用API读取文件的二进制内容
    return (await window.api.file.binaryFile(file.id + file.ext)).data
  }

  // 静态方法：上传文件
  static async uploadFile(file: FileType): Promise<FileType> {
    // 打印上传文件的信息
    console.log(`[FileManager] Uploading file: ${JSON.stringify(file)}`)

    // 调用API上传文件
    const uploadFile = await window.api.file.upload(file)
    // 从数据库获取文件记录
    const fileRecord = await db.files.get(uploadFile.id)

    // 如果文件记录存在，更新文件计数
    if (fileRecord) {
      await db.files.update(fileRecord.id, { ...fileRecord, count: fileRecord.count + 1 })
      return fileRecord
    }

    // 如果文件记录不存在，添加新文件
    await db.files.add(uploadFile)

    // 返回上传的文件对象
    return uploadFile
  }

  // 静态方法：批量上传文件
  static async uploadFiles(files: FileType[]): Promise<FileType[]> {
    // 使用Promise.all并行处理所有文件的上传
    return Promise.all(files.map((file) => this.uploadFile(file)))
  }

  // 静态方法：根据ID获取文件
  static async getFile(id: string): Promise<FileType | undefined> {
    // 从数据库获取文件记录
    const file = await db.files.get(id)

    // 如果文件记录存在，设置文件的完整路径
    if (file) {
      const filesPath = store.getState().runtime.filesPath
      file.path = filesPath + '/' + file.id + file.ext
    }

    // 返回文件对象
    return file
  }

  // 静态方法：删除文件
  static async deleteFile(id: string, force: boolean = false): Promise<void> {
    // 获取文件对象
    const file = await this.getFile(id)

    // 打印删除文件的信息
    console.log('[FileManager] Deleting file:', file)

    // 如果文件不存在，直接返回
    if (!file) {
      return
    }

    // 如果不强制删除且文件计数大于1，减少计数
    if (!force) {
      if (file.count > 1) {
        await db.files.update(id, { ...file, count: file.count - 1 })
        return
      }
    }

    // 从数据库删除文件记录
    await db.files.delete(id)

    // 尝试调用API删除文件
    try {
      await window.api.file.delete(id + file.ext)
    } catch (error) {
      // 如果删除失败，打印错误信息
      console.error('[FileManager] Failed to delete file:', error)
    }
  }

  // 静态方法：批量删除文件
  static async deleteFiles(files: FileType[]): Promise<void> {
    // 使用Promise.all并行处理所有文件的删除
    await Promise.all(files.map((file) => this.deleteFile(file.id)))
  }

  // 静态方法：获取所有文件
  static async allFiles(): Promise<FileType[]> {
    // 从数据库获取所有文件记录
    return db.files.toArray()
  }

  // 静态方法：判断文件是否为危险文件
  static isDangerFile(file: FileType) {
    // 检查文件扩展名是否在危险扩展名列表中
    return ['.sh', '.bat', '.cmd', '.ps1', '.vbs', 'reg'].includes(file.ext)
  }

  // 静态方法：获取文件的安全路径
  static getSafePath(file: FileType) {
    // 如果是危险文件，返回文件目录；否则返回文件完整路径
    return this.isDangerFile(file) ? getFileDirectory(file.path) : file.path
  }

  // 静态方法：获取文件的URL
  static getFileUrl(file: FileType) {
    // 获取文件存储路径
    const filesPath = store.getState().runtime.filesPath
    // 返回文件的URL
    return 'file://' + filesPath + '/' + file.name
  }

  // 静态方法：更新文件信息
  static async updateFile(file: FileType) {
    // 如果原始文件名不包含扩展名，添加扩展名
    if (!file.origin_name.includes(file.ext)) {
      file.origin_name = file.origin_name + file.ext
    }

    // 更新数据库中的文件记录
    await db.files.update(file.id, file)
  }

  // 静态方法：格式化文件名
  static formatFileName(file: FileType) {
    // 如果文件对象为空或原始文件名为空，返回空字符串
    if (!file || !file.origin_name) {
      return ''
    }

    // 格式化创建日期
    const date = dayjs(file.created_at).format('YYYY-MM-DD')

    // 根据文件类型返回不同的格式化文件名
    if (file.origin_name.includes('pasted_text')) {
      return date + ' ' + i18n.t('message.attachments.pasted_text') + file.ext
    }

    if (file.origin_name.startsWith('temp_file') && file.origin_name.includes('image')) {
      return date + ' ' + i18n.t('message.attachments.pasted_image') + file.ext
    }

    // 返回原始文件名
    return file.origin_name
  }
}

// 导出文件管理类
export default FileManager
