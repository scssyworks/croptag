import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [{
    input: 'index.js',
    output: {
        file: "dist/index.js",
        format: "umd",
        name: "CropTag"
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        })
    ]
}]