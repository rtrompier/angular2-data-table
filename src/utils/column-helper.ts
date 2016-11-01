import { camelCase, id } from '../utils';

export function setColumnDefaults(columns: any[]) {
  if(!columns) return;
  
  for(let column of columns) {
    if(!column.$$id) {
      column.$$id = id();
    }
    
    // translate name => prop
    if(!column.prop && column.name) {
      column.prop = camelCase(column.name);
    }
  
    if(!column.hasOwnProperty('resizeable')) {
      column.resizeable = true;
    }

    if(!column.hasOwnProperty('sortable')) {
      column.sortable = true;
    }

    if(!column.hasOwnProperty('draggable')) {
      column.draggable = true;
    }

    if(!column.hasOwnProperty('canAutoResize')) {
      column.canAutoResize = true;
    }

    if(!column.hasOwnProperty('width')) {
      column.width = 150;
    }
  }
}
