# input-inline custom element

This is a partial reimplementation of the `<input type="text">` element, but with `display: inline` behavior.

It's meant as a showcase for how to make vanilla custom elements behave like built-in form controls.

Part of the [Plain Vanilla Web](https://plainvanillaweb.com) project.

## Usage

Copy `input-inline.js` and `input-inline.css` into your project.

Include both into the page.

Use it like this:

```html
<form>
    <input-inline name="my-input" value="hello, world" required></input-inline>
</form>
```

Supported attributes/properties:
- `value` / `defaultValue`
- `readonly` / `readOnly`
- `disabled`
- `required`

Fires events like built-in control:
- `input`
- `change`

## Example

Run a static server:

`npx http-server .`

Browse to http://localhost:8080/example/index.html
