Compile using `deno run compile`; this will output the binary `improved-history`.

Add the following to your .zshrc to bind `improved-history` to Ctrl+R:

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
