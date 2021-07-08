# S3 image optimizer

Image proxy service for serving image thumbnails.

## How it works

Serve the best image formats for web according url params and browser support.

## Usage

1. Run `npm run start`
2. Visit `http://localhost/tr:w-266,h-266,f-avif/base/users/4688/works/N2OMdog75s.jpg`

where `/base/users/4688/works/N2OMdog75s.jpg` - is a path to your image inside S3 bucket.

## API

1. `f-{value}` - avif and webp supoported
2. `w-{value}` - width of result image
3. `h-{value}` - height of result image
