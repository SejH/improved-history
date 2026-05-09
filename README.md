Compile using `deno run compile`; this will output the binary
`improved-history`.

Add the following to your .zshrc to bind `improved-history` to Ctrl+R:

```zsh
function _improved-history() {
    zle -I
    LBUFFER=$(improved-history "$HOME/.zsh_history" < /dev/tty)
}
zle -N _improved-history
bindkey '^r' _improved-history
```
