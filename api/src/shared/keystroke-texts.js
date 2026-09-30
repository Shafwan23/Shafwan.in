/*
 * Keystroke lines by language, shared by the Worker (which times them) and the
 * Lab page (which shows them). Real, readable one-liners; ASCII only.
 */
export const LINES = {
  java: [
    'public static int max(int a, int b) { return a > b ? a : b; }',
    'List<String> names = new ArrayList<>(); names.add("Shafwan");',
    'for (int i = 0; i < nums.length; i++) { sum += nums[i]; }',
    'System.out.println("Hello, " + name + "!");',
    'if (map.containsKey(key)) { return map.get(key); }',
    'String[] parts = line.trim().split(",");',
  ],
  javascript: [
    'const total = items.reduce((sum, item) => sum + item.price, 0);',
    "const user = await fetch('/api/user').then((res) => res.json());",
    "document.querySelector('#save').addEventListener('click', save);",
    'export const isEven = (n) => n % 2 === 0;',
    'const { name, email } = req.body;',
    "const names = users.map((u) => u.name).join(', ');",
  ],
  python: [
    'squares = [n * n for n in range(10) if n % 2 == 0]',
    'def greet(name): return f"Hello, {name}!"',
    'with open("data.txt") as file: lines = file.readlines()',
    'total = sum(item["price"] for item in cart)',
    'if __name__ == "__main__": main()',
    'names = sorted(users, key=lambda u: u.age)',
  ],
  cpp: [
    'for (int i = 0; i < n; ++i) { total += values[i]; }',
    'std::vector<int> nums = {3, 1, 4, 1, 5, 9};',
    'std::cout << "Hello, " << name << std::endl;',
    'int mid = left + (right - left) / 2;',
    'std::string upper(std::string s) { return s; }',
    'while (!queue.empty()) { queue.pop(); }',
  ],
};

export const LANGS = Object.keys(LINES);
export const LANG_LABEL = { java: 'Java', javascript: 'JavaScript', python: 'Python', cpp: 'C++' };

/** Words per minute the way typing tests count them: five characters to a word. */
export const wpmOf = (chars, ms) => (ms > 0 ? Math.round((chars / 5) / (ms / 60000)) : 0);
