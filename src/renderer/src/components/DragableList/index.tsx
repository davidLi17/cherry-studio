import {
  DragDropContext, // 引入拖放上下文组件
  Draggable, // 引入可拖动组件
  Droppable, // 引入可放置组件
  DroppableProps, // 引入可放置组件的属性类型
  DropResult, // 引入拖放结果类型
  OnDragEndResponder, // 引入拖放结束的响应函数类型
  OnDragStartResponder, // 引入拖放开始的响应函数类型
  ResponderProvided // 引入响应函数提供的对象类型
} from '@hello-pangea/dnd' // 从@dnd库中引入相关组件和类型
import { droppableReorder } from '@renderer/utils' // 引入用于重新排序的工具函数
import VirtualList from 'rc-virtual-list' // 引入虚拟列表组件
import { FC } from 'react' // 引入React的函数组件类型

// 定义组件的属性接口
interface Props<T> {
  list: T[] // 列表数据
  style?: React.CSSProperties // 组件的样式（可选）
  listStyle?: React.CSSProperties // 列表项的样式（可选）
  children: (item: T, index: number) => React.ReactNode // 子组件渲染函数
  onUpdate: (list: T[]) => void // 更新列表数据的回调函数
  onDragStart?: OnDragStartResponder // 拖放开始时的回调函数（可选）
  onDragEnd?: OnDragEndResponder // 拖放结束时的回调函数（可选）
  droppableProps?: Partial<DroppableProps> // 可放置组件的额外属性（可选）
}

// 定义可拖动列表组件
const DragableList: FC<Props<any>> = ({
  children, // 子组件渲染函数
  list, // 列表数据
  style, // 组件的样式
  listStyle, // 列表项的样式
  droppableProps, // 可放置组件的额外属性
  onDragStart, // 拖放开始时的回调函数
  onUpdate, // 更新列表数据的回调函数
  onDragEnd // 拖放结束时的回调函数
}) => {
  // 处理拖放结束的逻辑
  const _onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    onDragEnd?.(result, provided) // 如果有拖放结束的回调函数，则调用它
    if (result.destination) {
      // 如果有目标位置
      const sourceIndex = result.source.index // 源位置的索引
      const destIndex = result.destination.index // 目标位置的索引
      const reorderAgents = droppableReorder(list, sourceIndex, destIndex) // 调用重新排序函数
      onUpdate(reorderAgents) // 更新列表数据
    }
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={_onDragEnd}>
      {/* 创建拖放上下文 */}
      <Droppable droppableId="droppable" {...droppableProps}>
        {/* 创建可放置区域 */}
        {(
          provided // 使用提供的属性和ref
        ) => (
          <div {...provided.droppableProps} ref={provided.innerRef} style={style}>
            {/* 创建可放置的容器 */}
            <VirtualList data={list} itemKey="id">
              {/* 使用虚拟列表组件 */}
              {(item, index) => {
                // 渲染每个列表项
                const id = item.id || item // 获取列表项的id
                return (
                  <Draggable key={`draggable_${id}_${index}`} draggableId={id} index={index}>
                    {/* 创建可拖动项 */}
                    {(
                      provided // 使用提供的属性和ref
                    ) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...listStyle,
                          ...provided.draggableProps.style,
                          marginBottom: 8 // 设置底部间距
                        }}>
                        {children(item, index)} {/* 渲染子组件 */}
                      </div>
                    )}
                  </Draggable>
                )
              }}
            </VirtualList>
            {provided.placeholder} {/* 插入占位符 */}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default DragableList // 导出可拖动列表组件
