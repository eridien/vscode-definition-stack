# Definition Stack

Definition Stack is a unique vscode extension for a unique (afaik) concept. It serves as a tool for reading code, especially code you are unfamiliar with. It is simple and fast with only one command. 

With files you are forced to compromise when organizing the structure of the file.  There is no definite place a function belongs. With Definition Stack (called DefStack from now on), instead of reading functions spread across many files, functions are presented in isolation in a single vscode tab.  They are stacked on top of each other.  Each one is a definition of a reference located in the one below it. Hence the name. 

I should point out that although I talk about functions, the items on the stack can be definitions of many types, like variables or modules.  They can be any symbol type used by the language processor in vscode.  I'll keep saying functions to keep this simple and functions are the most common.

You start building the stack by dropping the cursor anywhere in a function and executing the only command `Definition Stack: Open`. This opens a new tab in a different split so you can go between text editors and this stack. The function the cursor was in now appears in isolation in the tab which I'll now call the stack.

![Logo](./images/Screenshot.png)




