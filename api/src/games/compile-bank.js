/*
 * The Compile question bank. Server only: the browser never receives the answer
 * key, just each question with its options in a fresh order.
 * q: the question (may carry <code>), a: options, i: index of the right one.
 */
export const BANK = [
  { c: 'Complexity', q: 'Average time to look a key up in a hash table?', a: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], i: 0 },
  { c: 'Complexity', q: 'Worst-case time complexity of quicksort?', a: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], i: 0 },
  { c: 'Complexity', q: 'Binary search over a sorted array of n items?', a: ['O(log n)', 'O(1)', 'O(n)', 'O(√n)'], i: 0 },
  { c: 'Complexity', q: 'Best possible worst case for a comparison sort?', a: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n²)'], i: 0 },
  { c: 'Complexity', q: 'Reaching the k-th node of a singly linked list costs?', a: ['O(k)', 'O(1)', 'O(log k)', 'O(k log k)'], i: 0 },
  { c: 'Complexity', q: 'Space complexity of a recursive in-order traversal of a balanced BST?', a: ['O(log n)', 'O(1)', 'O(n)', 'O(n log n)'], i: 0 },

  { c: 'HTTP', q: 'Which status code means the resource moved permanently?', a: ['301', '302', '307', '410'], i: 0 },
  { c: 'HTTP', q: 'The client is authenticated but not allowed. Which code?', a: ['403', '401', '400', '409'], i: 0 },
  { c: 'HTTP', q: 'What does <code>429</code> tell the client?', a: ['Too many requests', 'Gateway timeout', 'Payload too large', 'Conflict'], i: 0 },
  { c: 'HTTP', q: 'Which method is idempotent but not safe?', a: ['PUT', 'GET', 'POST', 'CONNECT'], i: 0 },
  { c: 'HTTP', q: 'A <code>304</code> response means…', a: ['Not modified — use your cache', 'Permanently deleted', 'Switching protocols', 'Partial content'], i: 0 },
  { c: 'HTTP', q: 'Which header carries the caching policy for a response?', a: ['Cache-Control', 'Content-Policy', 'Expect', 'Vary-Cache'], i: 0 },

  { c: 'Git', q: 'Which command replays your commits onto a new base?', a: ['git rebase', 'git merge', 'git reflog', 'git stash'], i: 0 },
  { c: 'Git', q: 'Undo the last commit but keep every change staged?', a: ['git reset --soft HEAD~1', 'git reset --hard HEAD~1', 'git revert HEAD', 'git checkout HEAD~1'], i: 0 },
  { c: 'Git', q: 'Which command makes a new commit that undoes an old one?', a: ['git revert', 'git reset', 'git restore', 'git clean'], i: 0 },
  { c: 'Git', q: 'What does <code>git cherry-pick</code> do?', a: ['Applies one commit onto the current branch', 'Deletes a branch safely', 'Squashes a branch into one commit', 'Rewrites author metadata'], i: 0 },
  { c: 'Git', q: 'Where does git record where HEAD has been?', a: ['The reflog', 'The index', 'The stash', 'The packfile'], i: 0 },

  { c: 'CSS', q: 'Specificity of <code>#nav .item a</code> as (id, class, type)?', a: ['1, 1, 1', '1, 0, 2', '0, 2, 1', '1, 2, 0'], i: 0 },
  { c: 'CSS', q: 'Which unit is relative to the root font size?', a: ['rem', 'em', 'ex', 'vh'], i: 0 },
  { c: 'CSS', q: '<code>z-index</code> applies to which elements?', a: ['Positioned elements, and flex or grid items', 'Every element', 'Only absolutely positioned ones', 'Only elements with opacity below 1'], i: 0 },
  { c: 'CSS', q: 'Which property creates a new stacking context on its own?', a: ['opacity below 1', 'overflow: hidden', 'display: block', 'float: left'], i: 0 },
  { c: 'CSS', q: 'Which two properties can the compositor animate without layout or paint?', a: ['transform and opacity', 'width and height', 'top and left', 'margin and padding'], i: 0 },

  { c: 'JavaScript', q: 'What does <code>typeof null</code> return?', a: ["'object'", "'null'", "'undefined'", "'number'"], i: 0 },
  { c: 'JavaScript', q: '<code>0.1 + 0.2 === 0.3</code> evaluates to…', a: ['false', 'true', 'NaN', 'It throws'], i: 0 },
  { c: 'JavaScript', q: 'Which of these does <em>not</em> return a new array?', a: ['forEach', 'map', 'filter', 'slice'], i: 0 },
  { c: 'JavaScript', q: '<code>Promise.allSettled</code> resolves with…', a: ['An array of status objects, always', 'The first result to settle', 'Only the fulfilled values', 'A rejection on the first failure'], i: 0 },
  { c: 'JavaScript', q: 'A <code>let</code> binding is scoped to…', a: ['The enclosing block', 'The enclosing function', 'The module', 'The global object'], i: 0 },
  { c: 'JavaScript', q: 'Which runs first after the current task: a promise callback or a <code>setTimeout(…, 0)</code>?', a: ['The promise callback', 'The timeout', 'Whichever was queued first', 'They run in parallel'], i: 0 },
  { c: 'JavaScript', q: '<code>[] == false</code> evaluates to…', a: ['true', 'false', 'undefined', 'It throws'], i: 0 },

  { c: 'SQL', q: 'Which join keeps every row of the left table?', a: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN', 'RIGHT JOIN'], i: 0 },
  { c: 'SQL', q: 'Which clause filters rows <em>after</em> aggregation?', a: ['HAVING', 'WHERE', 'FILTER', 'QUALIFY'], i: 0 },
  { c: 'SQL', q: 'An index mainly trades away…', a: ['Write speed and storage', 'Read speed', 'Transaction safety', 'Referential integrity'], i: 0 },
  { c: 'SQL', q: 'What does the "I" in ACID stand for?', a: ['Isolation', 'Integrity', 'Idempotence', 'Indexing'], i: 0 },

  { c: 'The wire', q: 'Which port does HTTPS use by default?', a: ['443', '80', '8080', '22'], i: 0 },
  { c: 'The wire', q: 'DNS queries travel over which transport by default?', a: ['UDP', 'TCP', 'ICMP', 'QUIC'], i: 0 },
  { c: 'The wire', q: 'TCP guarantees…', a: ['Ordered, reliable delivery', 'Low latency', 'Encryption', 'Multicast'], i: 0 },
  { c: 'The wire', q: 'HTTP/3 runs on top of…', a: ['QUIC over UDP', 'TCP with TLS 1.3', 'SCTP', 'WebSockets'], i: 0 },

  { c: 'Regex', q: 'What does <code>\\b</code> match?', a: ['A zero-width word boundary', 'A literal backspace', 'Any blank character', 'The start of a line'], i: 0 },
  { c: 'Regex', q: 'Which quantifier is lazy?', a: ['*?', '*', '+', '{2,}'], i: 0 },

  { c: 'Security', q: 'Prepared statements primarily prevent…', a: ['SQL injection', 'Cross-site scripting', 'CSRF', 'Clickjacking'], i: 0 },
  { c: 'Security', q: '<code>HttpOnly</code> on a cookie stops…', a: ['JavaScript from reading it', 'It being sent cross-site', 'It being stored on disk', 'It being sent over HTTP'], i: 0 },
  { c: 'Security', q: 'Which is the right way to store user passwords?', a: ['A slow salted hash like bcrypt or argon2', 'SHA-256', 'AES encryption', 'Base64'], i: 0 },

  { c: 'Systems', q: '<code>1 << 10</code> equals…', a: ['1024', '512', '2048', '110'], i: 0 },
  { c: 'Systems', q: 'A UTF-8 code point takes at most how many bytes?', a: ['4', '2', '3', '6'], i: 0 },
  { c: 'Systems', q: '<code>chmod 755</code> gives the owner…', a: ['Read, write and execute', 'Read and write', 'Read and execute', 'Everything but execute'], i: 0 },
  { c: 'Systems', q: 'A race condition needs at least…', a: ['Two threads touching shared state, one writing', 'Two processes on one core', 'A lock held too long', 'An unhandled interrupt'], i: 0 },
  { c: 'Systems', q: 'Which structure gives first-in, first-out order?', a: ['Queue', 'Stack', 'Heap', 'Trie'], i: 0 },
  { c: 'Systems', q: 'The root of a binary heap always holds…', a: ['The minimum or maximum of the set', 'The median', 'The most recently added item', 'The deepest leaf'], i: 0 },
];
