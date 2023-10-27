# oshi_utils
## Some usefull utils might be usefull in later projects

### Extensions
Array prototype functions:
1. to_map(key_fn) - creates Map from array with key mapping arg
2. sort_by(fn) - sort array (default compare), with value mapping arg
3. sum(fn) - array sum, fn=iteratee function
4. min(fn) - array min, fn=iteratee function
5. max(fn) - array max, fn=iteratee function
6. select_recursive(child_fn) - recursive array selecting. Return flat list, uses child_fn on every array element

Map prototype functions:
1. keys_arr - map keys as array
2. values_arr - map values as array
3. entries_arr - map entries ([key, value]) as array
