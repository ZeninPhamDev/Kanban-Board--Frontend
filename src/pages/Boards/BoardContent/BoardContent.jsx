import { cloneDeep } from 'lodash'
import Card from './ListColumns/Column/ListCards/Card/Card'
import Column from './ListColumns/Column/Column'
import { useState } from 'react'
import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { mapOrder } from '~/utils/sorts'
import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { useEffect } from 'react'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  // const pointerSensor = useSensor(PointerSensor, {
  //   activationConstraint: { distance: 10 }
  // })
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 }
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 500 }
  })
  const sensor = useSensors(mouseSensor, touchSensor)

  const [orderedColumns, setOrderedColumns] = useState([])

  // cung mot thoi diem chi co Column hoac Card duoc keo
  // const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)

  useEffect(() => {
    const orderedColumns = mapOrder(
      board?.columns,
      board?.columnOrderIds,
      '_id'
    )
    setOrderedColumns(orderedColumns)
  }, [board])

  // Tìm một cái column theo cardId
  const findColumnByCardId = (cardId) => {
    return orderedColumns.find((column) =>
      column.cards.map((card) => card._id)?.includes(cardId)
    )
  }

  // Drag start
  const handleDragStart = (event) => {
    // console.log(event)
    // setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN
    )
    setActiveDragItemData(event?.active?.data.current)
  }
  // Drag over
  const handleDragOver = (event) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      const { active, over } = event
      if (!active || !over) return

      const {
        id: activeDraggingCardId,
        data: { current: activeDraggingCardData }
      } = active
      const { id: overCardId } = over

      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      if (!activeColumn || !overColumn) return

      if (activeColumn._id !== overColumn._id) {
        setOrderedColumns((prevColumns) => {
          const overCardIndex = overColumn?.cards?.findIndex(
            (card) => card._id === overCardId
          )

          let newCardIndex
          const isBelowOverItem =
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height

          const modifier = isBelowOverItem ? 1 : 0

          newCardIndex =
            overCardIndex >= 0
              ? overCardIndex + modifier
              : overColumn?.cards?.length + 1

          const nextColumns = cloneDeep(prevColumns)

          const nextActiveColumn = nextColumns.find(
            (column) => column._id === activeColumn._id
          )
          const nextOverColumn = nextColumns.find(
            (column) => column._id === overColumn._id
          )

          if (nextActiveColumn) {
            nextActiveColumn.cards = nextActiveColumn.cards.filter(
              (card) => card._id !== activeDraggingCardId
            )
            nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
              (card) => card._id
            )
          }

          if (nextOverColumn) {
            nextOverColumn.cards = nextOverColumn.cards.filter(
              (card) => card._id !== activeDraggingCardId
            )
            nextOverColumn.cards = nextOverColumn.cards.toSpliced(
              newCardIndex,
              0,
              activeDraggingCardData
            )
            nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
              (card) => card._id
            )
          }

          return nextColumns
        })
      }
    }
  }

  // Drag end
  const handleDragEnd = (event) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // console.log('Keo tha Card')
      return
    }
    const { active, over } = event
    if (!active || !over) return

    if (active.id !== over.id) {
      const oldIndex = orderedColumns.findIndex((c) => c._id === active.id)
      const newIndex = orderedColumns.findIndex((c) => c._id === over.id)
      const dndOrderedColumns = arrayMove(orderedColumns, oldIndex, newIndex)
      // Sau xu ly Api
      // const dndOrderedColumnsIds = dndOrderedColumns.map((c) => c._id)
      setOrderedColumns(dndOrderedColumns)
    }
    // setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } }
    })
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={sensor}>
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#34495e' : '#1976d2',
          width: '100%',
          height: (theme) => theme.trello.boardContentHeight
        }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
            <Column column={activeDragItemData} />
          )}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
            <Card card={activeDragItemData} />
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}
export default BoardContent
