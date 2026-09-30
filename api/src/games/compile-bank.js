/*
 * The Compile question bank. Server only: the browser never receives the answer
 * key, just each question with its options in a fresh order.
 * c: category, q: the question (may carry <code>), a: options, i: index of the right one.
 * Pitched at fundamentals: things a working developer meets every week.
 */
export const BANK = [
  { c: 'JavaScript', q: 'Which keyword declares a variable that cannot be reassigned?', a: ['const', 'let', 'var', 'static'], i: 0 },
  { c: 'JavaScript', q: 'What does <code>[1, 2, 3].length</code> return?', a: ['3', '2', '4', 'undefined'], i: 0 },
  { c: 'JavaScript', q: 'Which method adds an item to the end of an array?', a: ['push', 'pop', 'shift', 'slice'], i: 0 },
  { c: 'JavaScript', q: '<code>typeof "hello"</code> returns…', a: ["'string'", "'text'", "'object'", "'char'"], i: 0 },
  { c: 'JavaScript', q: 'Which comparison checks value <em>and</em> type?', a: ['===', '==', '=', '!='], i: 0 },
  { c: 'JavaScript', q: 'What does <code>JSON.parse</code> do?', a: ['Turns a JSON string into an object', 'Turns an object into a string', 'Validates a URL', 'Fetches JSON from a server'], i: 0 },
  { c: 'JavaScript', q: 'Which method turns <code>"a,b,c"</code> into <code>["a","b","c"]</code>?', a: ['split(",")', 'join(",")', 'slice(",")', 'map(",")'], i: 0 },
  { c: 'JavaScript', q: 'An <code>async</code> function always returns…', a: ['A Promise', 'undefined', 'A callback', 'An array'], i: 0 },
  { c: 'JavaScript', q: 'Which loop runs at least once, even if the condition is false?', a: ['do…while', 'while', 'for', 'for…of'], i: 0 },
  { c: 'JavaScript', q: '<code>Math.floor(4.7)</code> gives…', a: ['4', '5', '4.7', '0'], i: 0 },

  { c: 'CSS', q: 'Which property changes the text colour?', a: ['color', 'font-color', 'text-color', 'foreground'], i: 0 },
  { c: 'CSS', q: 'Which value of <code>display</code> lays children out in a row by default?', a: ['flex', 'block', 'inline', 'grid'], i: 0 },
  { c: 'CSS', q: 'Which selector targets an element with <code>id="hero"</code>?', a: ['#hero', '.hero', 'hero', '*hero'], i: 0 },
  { c: 'CSS', q: 'The space <em>inside</em> an element, between content and border, is…', a: ['padding', 'margin', 'gap', 'outline'], i: 0 },
  { c: 'CSS', q: 'Which unit is relative to the root font size?', a: ['rem', 'px', 'vh', '%'], i: 0 },
  { c: 'CSS', q: 'Which rule applies styles only on screens narrower than 600px?', a: ['@media (max-width: 600px)', '@media (min-width: 600px)', '@screen 600px', '@width < 600px'], i: 0 },
  { c: 'CSS', q: 'Which property makes an element fully transparent?', a: ['opacity: 0', 'visibility: visible', 'display: block', 'z-index: 0'], i: 0 },
  { c: 'CSS', q: 'To centre items both ways in a flex container you set…', a: ['justify-content and align-items to center', 'text-align: center', 'margin: 0', 'float: center'], i: 0 },

  { c: 'HTML', q: 'Which tag makes a link?', a: ['<a>', '<link>', '<href>', '<url>'], i: 0 },
  { c: 'HTML', q: 'Which attribute gives an image alternative text?', a: ['alt', 'title', 'label', 'desc'], i: 0 },
  { c: 'HTML', q: 'Which tag holds the page title shown in the browser tab?', a: ['<title>', '<h1>', '<head>', '<meta>'], i: 0 },
  { c: 'HTML', q: 'Which element is the right one for the main navigation?', a: ['<nav>', '<div>', '<menu>', '<section>'], i: 0 },
  { c: 'HTML', q: 'Which input type hides what is typed?', a: ['password', 'hidden', 'secret', 'text'], i: 0 },
  { c: 'HTML', q: 'The <code>&lt;form&gt;</code> attribute that sets where data is sent is…', a: ['action', 'method', 'target', 'href'], i: 0 },

  { c: 'Git', q: 'Which command saves a snapshot of staged changes?', a: ['git commit', 'git add', 'git push', 'git save'], i: 0 },
  { c: 'Git', q: 'Which command downloads a repository for the first time?', a: ['git clone', 'git pull', 'git fetch', 'git init'], i: 0 },
  { c: 'Git', q: 'Which command sends your commits to GitHub?', a: ['git push', 'git commit', 'git upload', 'git merge'], i: 0 },
  { c: 'Git', q: 'Which command creates and switches to a new branch?', a: ['git checkout -b name', 'git branch -d name', 'git switch --delete name', 'git new name'], i: 0 },
  { c: 'Git', q: 'What does <code>git status</code> show?', a: ['Changed and staged files', 'The commit history', 'Remote branches', 'Merge conflicts only'], i: 0 },
  { c: 'Git', q: 'A file listed in <code>.gitignore</code> is…', a: ['Never tracked by Git', 'Deleted on commit', 'Hidden from your editor', 'Committed first'], i: 0 },
  { c: 'Git', q: 'Which command brings a branch’s changes into the current branch?', a: ['git merge', 'git clone', 'git stash', 'git tag'], i: 0 },

  { c: 'HTTP', q: 'Status code <code>404</code> means…', a: ['Not found', 'Server error', 'OK', 'Forbidden'], i: 0 },
  { c: 'HTTP', q: 'Status code <code>200</code> means…', a: ['OK', 'Created', 'Redirect', 'Not modified'], i: 0 },
  { c: 'HTTP', q: 'Which method is used to fetch data without changing it?', a: ['GET', 'POST', 'PUT', 'DELETE'], i: 0 },
  { c: 'HTTP', q: 'Which method usually creates a new record?', a: ['POST', 'GET', 'HEAD', 'OPTIONS'], i: 0 },
  { c: 'HTTP', q: 'Status codes starting with <code>5</code> mean the problem is on the…', a: ['Server', 'Client', 'Network cable', 'Browser cache'], i: 0 },
  { c: 'HTTP', q: 'HTTPS differs from HTTP because it is…', a: ['Encrypted', 'Faster', 'Only for images', 'Cached'], i: 0 },
  { c: 'HTTP', q: 'Which header tells the server the body is JSON?', a: ['Content-Type: application/json', 'Accept-Language', 'Authorization', 'Cache-Control'], i: 0 },

  { c: 'SQL', q: 'Which statement reads rows from a table?', a: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], i: 0 },
  { c: 'SQL', q: 'Which clause filters rows?', a: ['WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT'], i: 0 },
  { c: 'SQL', q: 'Which clause sorts the result?', a: ['ORDER BY', 'SORT BY', 'GROUP BY', 'ALIGN BY'], i: 0 },
  { c: 'SQL', q: 'A column that uniquely identifies each row is the…', a: ['Primary key', 'Foreign key', 'Index', 'View'], i: 0 },
  { c: 'SQL', q: 'Which function counts rows?', a: ['COUNT(*)', 'SUM(*)', 'TOTAL()', 'ROWS()'], i: 0 },
  { c: 'SQL', q: 'Which join returns only rows that match in both tables?', a: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], i: 0 },

  { c: 'React', q: 'Which hook stores state in a function component?', a: ['useState', 'useEffect', 'useRef', 'useMemo'], i: 0 },
  { c: 'React', q: 'Which hook runs code after render, like fetching data?', a: ['useEffect', 'useState', 'useContext', 'useId'], i: 0 },
  { c: 'React', q: 'Data passed from a parent to a child component is called…', a: ['props', 'state', 'context', 'refs'], i: 0 },
  { c: 'React', q: 'In JSX, a CSS class is set with…', a: ['className', 'class', 'cssClass', 'styleName'], i: 0 },
  { c: 'React', q: 'Rendering a list, each item should have a unique…', a: ['key', 'id attribute', 'ref', 'index prop'], i: 0 },
  { c: 'React', q: 'A component re-renders when…', a: ['Its state or props change', 'The user scrolls', 'A CSS file loads', 'The page is printed'], i: 0 },

  { c: 'Node.js', q: 'Which file lists a Node project’s dependencies?', a: ['package.json', 'node.json', 'deps.txt', 'index.js'], i: 0 },
  { c: 'Node.js', q: 'Which command installs dependencies?', a: ['npm install', 'npm run', 'npm start', 'npm build'], i: 0 },
  { c: 'Node.js', q: 'Which folder holds installed packages?', a: ['node_modules', 'packages', 'vendor', 'lib'], i: 0 },
  { c: 'Node.js', q: 'In Express, <code>app.get("/users", handler)</code> handles…', a: ['GET requests to /users', 'All requests', 'POST requests to /users', 'Static files'], i: 0 },
  { c: 'Node.js', q: 'Which object holds environment variables in Node?', a: ['process.env', 'window.env', 'global.vars', 'os.env'], i: 0 },
  { c: 'Node.js', q: 'Which statement loads a module in modern JavaScript?', a: ['import', 'include', 'load', 'using'], i: 0 },

  { c: 'Basics', q: 'Which data structure is first in, first out?', a: ['Queue', 'Stack', 'Tree', 'Set'], i: 0 },
  { c: 'Basics', q: 'Which data structure is last in, first out?', a: ['Stack', 'Queue', 'Graph', 'Map'], i: 0 },
  { c: 'Basics', q: 'How many values can one bit hold?', a: ['2', '1', '8', '16'], i: 0 },
  { c: 'Basics', q: 'How many bits are in a byte?', a: ['8', '4', '16', '32'], i: 0 },
  { c: 'Basics', q: 'Binary <code>1010</code> in decimal is…', a: ['10', '8', '12', '5'], i: 0 },
  { c: 'Basics', q: 'Searching a sorted list by halving it each step is called…', a: ['Binary search', 'Linear search', 'Bubble sort', 'Hashing'], i: 0 },
  { c: 'Basics', q: 'A function that calls itself is…', a: ['Recursive', 'Asynchronous', 'Static', 'Abstract'], i: 0 },
  { c: 'Basics', q: 'What does API stand for?', a: ['Application Programming Interface', 'Advanced Program Integration', 'Applied Protocol Internet', 'Automatic Process Input'], i: 0 },
];
