iglue.formatters.remaining = function (todos) {
  return todos.filter((todo) => todo.completed).length;
}

iglue.formatters.filterBy = function (todos, visibility) {
  return todos.filter((todo) => {
    if (visibility === 'active') {
      return todo.completed !== true;
    } else if (visibility === 'completed') {
      return todo.completed === true;
    } else {
      return true;
    }
  });
}

const el = document.body;

const data = {

  visibility: 'all',

  todos: [{
    title: 'Take the cake',
    completed: true
  }, {
    title: 'Kill Glados',
    completed: false
  }],

  allDone(event, input) {
    for (const todo of this.todos) {
      todo.completed = input.checked;
    }
  },

  removeCompleted() {
    this.todos = this.todos.filter((todo) => {
      return todo.completed !== true;
    });
  },

  removeTodo(todo) {
    this.todos = this.todos.filter((current) => current !== todo);
  },

  setVisibility(visibility) {
    this.visibility = visibility;
  }

};

window.view = iglue.bind(el, data);
