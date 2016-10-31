import {
  Directive,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList
} from '@angular/core';

import { DraggableDirective } from './draggable.directive';

@Directive({ selector: '[orderable]' })
export class OrderableDirective {

  @Output() onReorder: EventEmitter<any> = new EventEmitter();

  @ContentChildren(DraggableDirective)
  private drags: QueryList<DraggableDirective>;

  private positions: any;

  ngAfterContentInit() {
    this.drags.forEach(d =>
      d.onDragStart.subscribe(this.onDragStart.bind(this)) &&
      d.onDragEnd.subscribe(this.onDragEnd.bind(this)));
  }

  onDragStart() {
    this.positions = {};

    let i = 0;
    for(let dragger of this.drags.toArray()) {
      let elm = dragger.element;
      this.positions[dragger.model.prop] =  {
        left: parseInt(elm.offsetLeft.toString(), 0),
        index: i++
      };
    }
  }

  onDragEnd({ element, model }) {
    const newPos = parseInt(element.offsetLeft.toString(), 0);
    const prevPos = this.positions[model.prop];

    let i = 0;
    for(let prop in this.positions) {
      let pos = this.positions[prop];

      let movedLeft = newPos < pos.left && prevPos.left > pos.left;
      let movedRight = newPos > pos.left && prevPos.left < pos.left;

      if(movedLeft || movedRight) {
        this.onReorder.emit({
          prevIndex: prevPos.index,
          newIndex: i,
          model
        });
      }

      i++;
    }

    element.style.left = 'auto';
  }

}
