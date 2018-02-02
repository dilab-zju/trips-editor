import { identical } from 'ramda'
import { InteractionFn, State } from '../interfaces'

const dragItems: InteractionFn = ({ mouse, mode: mode$, state: state$ }) => {
  const dragStart$ = mouse.down$
    .when(mode$, identical('idle'))
    .whenNot(mouse.isBusy$)
    .sampleCombine(state$)
    .map(([pos, state]) => {
      const clickedItems = state.items.filter(item => item.containsPoint(pos))
      const targetItemId = state.zlist.findLast(itemId => clickedItems.has(itemId))
      const startItems = state.items.filter(item => item.id === targetItemId)
      if (!startItems.isEmpty()) {
        return { startPos: pos, startItems }
      }
      return null
      // TODO 支持多个元素的拖动
    })
    .startWith(null)

  const dragItems$ = dragStart$
    .checkedFlatMap(({ startItems, startPos }) =>
      mouse.move$
        .map(pos => {
          const dx = pos.x - startPos.x
          const dy = pos.y - startPos.y
          const movedItems = startItems.map(item => item.move(dx, dy))
          return State.moveItems(movedItems)
        })
        .endWhen(mouse.up$),
    )
    .filter(Boolean)

  return { action: dragItems$ }
}

export default dragItems
