import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Shield, Link2, Terminal, Globe, Zap, ChevronRight } from "lucide-react";
import { Toaster, toast } from "sonner";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PROXY_BASE = `${BACKEND_URL}/api`;

// ─── Code Examples ────────────────────────────────────────────────────────────
const CURL_GET = `curl "${PROXY_BASE}/https://api.example.com/users" \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const CURL_POST = `curl -X POST "${PROXY_BASE}/https://api.example.com/data" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "value"}'`;

const JS_FETCH = `// GET 请求
const res = await fetch(
  \`${PROXY_BASE}/https://api.example.com/users\`,
  {
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
    },
  }
);
const data = await res.json();

// POST 请求
const res2 = await fetch(
  \`${PROXY_BASE}/https://api.example.com/data\`,
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key: "value" }),
  }
);`;

const PYTHON_REQUESTS = `import requests

# GET 请求
resp = requests.get(
    f"${PROXY_BASE}/https://api.example.com/users",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)
print(resp.json())

# POST 请求
resp = requests.post(
    f"${PROXY_BASE}/https://api.example.com/data",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={"key": "value"},
)
print(resp.json())`;

// ─── Components ───────────────────────────────────────────────────────────────

function CodeBlock({ code, id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-black border border-[#222222] rounded-lg overflow-hidden group">
      <button
        data-testid={`copy-${id}`}
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded transition-colors duration-200 bg-[#1a1a1a] border border-white/10 hover:border-white/30 hover:bg-[#2a2a2a]"
        title="复制"
      >
        {copied
          ? <Check size={14} className="text-green-400" />
          : <Copy size={14} className="text-neutral-400" />
        }
      </button>
      <pre className="p-5 pr-12 overflow-x-auto text-sm leading-relaxed text-neutral-200 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="p-6 bg-[#121212] border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#007AFF]/10 rounded-md">
          <Icon size={18} className="text-[#007AFF]" />
        </div>
        <h3 className="text-white font-semibold text-sm tracking-tight">{title}</h3>
      </div>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Section({ children, className = "" }) {
  return (
    <section className={`border-t border-white/10 pt-16 ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs uppercase tracking-widest text-[#007AFF] font-mono mb-3">
      {children}
    </p>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toaster theme="dark" position="bottom-right" />

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#007AFF]" />
            <span className="font-mono text-sm font-semibold tracking-tight text-white">HTTP Proxy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-mono text-neutral-400">Running</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/79692cdf-ec35-4807-895b-511ff024b6eb/images/731675a16455a95f021bc331bf75cc8134d3d674180f0d2faf522eca02660e56.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            }}
          />
          <div className="relative">
            <div
              data-testid="status-badge"
              className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-[#121212] border border-white/10 rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="font-mono text-xs text-neutral-400">Status: Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-5 leading-none">
              透明 HTTP<br />
              <span className="text-[#007AFF]">代理服务</span>
            </h1>

            <p className="text-base text-neutral-300 leading-relaxed max-w-xl mb-8">
              基于 URL 路径的安全透明代理。将目标 URL 附加在代理地址之后，
              即可无缝转发请求与响应——支持全部 HTTP 方法、请求头与请求体。
            </p>

            <div
              data-testid="proxy-base-url"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black border border-[#222222] rounded-lg font-mono text-sm text-neutral-300"
            >
              <Link2 size={14} className="text-[#007AFF] shrink-0" />
              <span className="break-all">{PROXY_BASE}/<span className="text-[#007AFF]">TARGET_URL</span></span>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Zap} title="全方法支持" desc="GET · POST · PUT · DELETE · PATCH · HEAD · OPTIONS，全部 HTTP 方法均透明转发。" />
          <FeatureCard icon={Shield} title="Bearer Token 鉴权" desc="请求须携带有效的 Authorization: Bearer Token，未授权请求返回 401。" />
          <FeatureCard icon={Globe} title="跨域支持（CORS）" desc="代理服务已开启 CORS，支持浏览器端直接跨域调用。" />
        </div>

        {/* ── Authentication ── */}
        <Section>
          <SectionLabel>Authentication</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">鉴权方式</h2>
          <p className="text-neutral-400 text-base mb-6 leading-relaxed">
            每个请求必须在 HTTP 请求头中携带 Bearer Token，否则返回 <code className="text-neutral-200 bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono">401 Unauthorized</code>。
            Token 由服务管理员在后端 <code className="text-neutral-200 bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono">.env</code> 文件中配置（字段 <code className="text-neutral-200 bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono">PROXY_AUTH_TOKEN</code>）。
          </p>

          <div className="p-6 bg-[#121212] border border-white/10 rounded-lg">
            <p className="text-xs uppercase tracking-widest font-mono text-neutral-500 mb-3">Request Header</p>
            <CodeBlock id="auth-header" code={`Authorization: Bearer YOUR_TOKEN`} />
            <div className="mt-4 flex items-start gap-3">
              <Shield size={15} className="text-[#007AFF] mt-0.5 shrink-0" />
              <p className="text-sm text-neutral-400 leading-relaxed">
                Token 格式为 <code className="text-neutral-200 font-mono">sk-emergent-xxxx</code>。
                所有原始请求头（包含 Authorization）均会被转发至目标服务器。
              </p>
            </div>
          </div>
        </Section>

        {/* ── URL Format ── */}
        <Section>
          <SectionLabel>URL Format</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">URL 格式</h2>
          <p className="text-neutral-400 text-base mb-6 leading-relaxed">
            将目标 URL 直接拼接在代理基础地址 <code className="text-neutral-200 bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono">/api/</code> 之后即可。
          </p>

          <div className="space-y-3">
            <div className="p-5 bg-[#121212] border border-white/10 rounded-lg">
              <p className="text-xs uppercase tracking-widest font-mono text-neutral-500 mb-3">Pattern</p>
              <div data-testid="url-pattern" className="font-mono text-sm text-neutral-200 break-all">
                <span className="text-neutral-500">{BACKEND_URL}</span>
                <span className="text-white">/api/</span>
                <span className="text-[#007AFF]">https://target.com/path</span>
              </div>
            </div>

            <div className="p-5 bg-[#121212] border border-white/10 rounded-lg">
              <p className="text-xs uppercase tracking-widest font-mono text-neutral-500 mb-3">Example</p>
              <div className="space-y-2">
                {[
                  { method: "GET", target: "https://api.example.com/users" },
                  { method: "POST", target: "https://api.example.com/data" },
                  { method: "GET", target: "https://httpbin.org/get?foo=bar" },
                ].map(({ method, target }) => (
                  <div key={method + target} className="flex items-center gap-3 font-mono text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      method === "GET" ? "bg-green-500/10 text-green-400" :
                      method === "POST" ? "bg-blue-500/10 text-blue-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>{method}</span>
                    <span className="text-neutral-500 break-all">{PROXY_BASE}/{target}</span>
                    <ChevronRight size={12} className="text-neutral-600 shrink-0" />
                    <span className="text-neutral-300 break-all">{target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Code Examples ── */}
        <Section>
          <SectionLabel>Code Examples</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">使用示例</h2>
          <p className="text-neutral-400 text-base mb-6">
            将 <code className="text-neutral-200 bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono">YOUR_TOKEN</code> 替换为实际的鉴权 Token。
          </p>

          <Tabs defaultValue="curl" data-testid="code-tabs">
            <TabsList className="bg-[#121212] border border-white/10 mb-4 h-10">
              <TabsTrigger data-testid="tab-curl" value="curl" className="font-mono text-xs data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">
                <Terminal size={13} className="mr-1.5" /> cURL
              </TabsTrigger>
              <TabsTrigger data-testid="tab-js" value="js" className="font-mono text-xs data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">
                JavaScript
              </TabsTrigger>
              <TabsTrigger data-testid="tab-python" value="python" className="font-mono text-xs data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">
                Python
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="space-y-3 mt-0">
              <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">GET Request</p>
              <CodeBlock id="curl-get" code={CURL_GET} />
              <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest pt-2">POST Request</p>
              <CodeBlock id="curl-post" code={CURL_POST} />
            </TabsContent>

            <TabsContent value="js" className="mt-0">
              <CodeBlock id="js-fetch" code={JS_FETCH} />
            </TabsContent>

            <TabsContent value="python" className="mt-0">
              <CodeBlock id="python-requests" code={PYTHON_REQUESTS} />
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── Response Notes ── */}
        <Section>
          <SectionLabel>Response</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">响应说明</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { code: "200 – 5xx", desc: "目标服务器返回的原始状态码，完整透传" },
              { code: "401", desc: "缺少 Authorization 请求头" },
              { code: "403", desc: "Token 无效" },
              { code: "400", desc: "目标 URL 格式错误（需以 http:// 或 https:// 开头）" },
            ].map(({ code, desc }) => (
              <div key={code} className="flex items-start gap-4 p-4 bg-[#121212] border border-white/10 rounded-lg">
                <code className="font-mono text-sm text-[#007AFF] shrink-0">{code}</code>
                <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/10 pt-8 pb-4">
          <p className="text-neutral-600 text-xs font-mono text-center">
            HTTP Transparent Proxy &nbsp;·&nbsp; Bearer Token Auth &nbsp;·&nbsp; CORS Enabled
          </p>
        </footer>

      </div>
    </div>
  );
}
