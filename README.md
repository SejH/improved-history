Add the following to your .zshrc to bind the improved-history command to Ctrl+R:

```zsh
function improved-history() {
    zle -I
    command_file=$(mktemp)
    history_file="$HOME/.zsh_history"
    improved-history $command_file $history_file < /dev/tty
    LBUFFER=$(cat $command_file)
    # cleanup
    rm $command_file
}
zle -N improved-history
bindkey '^r' improved-history
```
