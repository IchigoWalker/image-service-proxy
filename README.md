# S3 image optimizer

Image proxy service for serving image thumbnails.

## How it works

Serve the best image formats for web according url params and browser support.

## Usage

1. Run `npm run start`
2. Visit `http://localhost:6100/tr:w-266,h-266,f-avif/image.jpg`

where `image.jpg` - is a path to your image inside S3 bucket root.

For choosing best format automatically you can do the following:

```
<picture>
  <source srcset="http://localhost:6100/tr:w-266,h-266,f-avif/image.jpg" type="image/avif">
  <source srcset="https://localhost:6100/tr:w-266,h-266,f-webp/image.jpg" type="image/webp">
  <img src="https://localhost:6100/tr:w-266,h-266,f-jpg/image.jpg">
</picture>
```

## API

1. `f-{value}` - avif and webp supoported
2. `w-{value}` - width of result image
3. `h-{value}` - height of result image
