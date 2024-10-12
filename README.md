# 🎲 Game Action for BGA Terra Mystica

**Run this in the console in your BGA Terra Mystica game**  
or create a bookmarklet using [this tool](https://caiorss.github.io/bookmarklet-maker/).

```javascript
fetch('https://raw.githubusercontent.com/Nicholas-Kyle/Terra-Mystica-Toolbar/main/toolbar')
    .then(response => response.text())
    .then(data => eval(data))
    .catch(error => console.error('Error fetching the command:', error));
