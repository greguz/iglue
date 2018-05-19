(function (window, iglue) {

  iglue.binders.focus = function (el, editing) {
    if (editing === true) {
      el.focus();
    }
  };

  iglue.formatters.remaining = function (todos) {
    return todos.filter(function (todo) {
      return todo.completed !== true;
    }).length;
  };

  iglue.formatters.filterBy = function (todos, visibility) {
    return todos.filter(function (todo) {
      if (visibility === "active") {
        return todo.completed !== true;
      } else if (visibility === "completed") {
        return todo.completed === true;
      } else {
        return true;
      }
    });
  };

  window.data = {

    newTodo: "",

    visibility: "all",

    todos: [{
      title: "Take the cake",
      completed: true
    }, {
      title: "Kill Glados",
      completed: false
    }],

    allDone: function (event, input) {
      this.todos = this.todos.map(function (todo) {
        todo.completed = input.checked;
        return todo;
      });
    },

    removeCompleted: function () {
      this.todos = this.todos.filter(function (todo) {
        return todo.completed !== true;
      });
    },

    removeTodo: function (todo) {
      this.todos = this.todos.filter(function (current) {
        return current !== todo;
      });
    },

    setVisibility: function (visibility) {
      this.visibility = visibility;
    },

    onNewTodoKeyUp: function (event) {
      if (event.keyCode === 13) { // ENTER
        this.todos.unshift({ title: this.newTodo });
        this.newTodo = "";
      }
    },

    editTodo: function (todo) {
      todo.editing = true;
    },

    doneEdit: function () {
      this.todos = this.todos.map(function (todo) {
        todo.editing = false;
        return todo;
      });
    }

  };

  window.view = iglue.bind(document.body, window.data);

})(window, iglue);
