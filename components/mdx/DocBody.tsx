import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { ZoomImages } from "@/components/ZoomImages/ZoomImages"
import { mdxComponents } from "@/components/mdx"
import type { ReactNode } from "react"

type Props = {
  title: string
  description?: string
  source: string
  actions?: ReactNode
}

// Shared MDX render block used by both the normal doc page and the AI view's
// rendered-doc pane, so the two are guaranteed to stay visually in sync.
export function DocBody({ title, description, source, actions }: Props) {
  return (
    <>
      <div className="max-w-[680px]">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">{title}</h1>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{description}</p>
        )}
        {actions}
      </div>
      <ZoomImages />
      <div className="prose prose-gray mt-6">
        <MDXRemote
          source={source}
          components={mdxComponents}
          options={{
            // blockJS must be false so JSX prop expressions like n={1} are not stripped
            blockJS: false,
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap" }],
              ],
            },
          }}
        />
      </div>
    </>
  )
}
