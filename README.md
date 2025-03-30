Add the following to your .zshrc to bind the improved-history command to Ctrl+R:
``` zsh
function improved-history() {
    zle -I
    improved-history < /dev/tty
    LBUFFER=$(cat /tmp/improved-history_command)
    echo "" > /tmp/improved-history_command
}
zle -N improved-history
bindkey '^r' improved-history
```
