import { useState } from "react";
import {
  Shield,
  Globe,
  Zap,
  BarChart3,
  Database,
  Users,
  ArrowRight,
  Layers,
  Lock,
  Activity,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import "@/App.css";

// ─── Components ───────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="group p-6 bg-[#121212] border border-white/10 rounded-xl hover:border-[#007AFF]/40 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-[#007AFF]/10 rounded-lg group-hover:bg-[#007AFF]/20 transition-colors duration-300">
          <Icon size={20} className="text-[#007AFF]" />
        </div>
        <h3 className="text-white font-semibold text-sm tracking-tight">{title}</h3>
      </div>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-black tracking-tighter text-white mb-1">{value}</p>
      <p className="text-xs uppercase tracking-widest text-neutral-500 font-mono">{label}</p>
    </div>
  );
}

function ServiceRow({ icon: Icon, name, status, desc }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#0f0f0f] border border-white/5 rounded-lg hover:border-white/15 transition-colors duration-200">
      <div className="p-2 bg-[#121212] border border-white/10 rounded-lg shrink-0">
        <Icon size={16} className="text-[#007AFF]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
            status === "active"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}>
            {status === "active" ? "运行中" : "维护中"}
          </span>
        </div>
        <p className="text-xs text-neutral-500 truncate">{desc}</p>
      </div>
      <ChevronRight size={14} className="text-neutral-600 shrink-0" />
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
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("提交成功，我们会尽快与您联系");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toaster theme="dark" position="bottom-right" />

      {/* ── Nav ── */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Northstar</span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-xs text-neutral-400 hover:text-white transition-colors">功能</a>
            <a href="#services" className="text-xs text-neutral-400 hover:text-white transition-colors">服务</a>
            <a href="#contact" className="text-xs text-neutral-400 hover:text-white transition-colors">联系</a>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-mono text-neutral-400">All Systems Normal</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden pt-8 pb-4">
          {/* Gradient orb background */}
          <div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] opacity-[0.07] pointer-events-none rounded-full"
            style={{
              background: "radial-gradient(circle, #007AFF 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-[#121212] border border-white/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="font-mono text-xs text-neutral-400">v2.4 — 平台已就绪</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-5 leading-[0.95]">
              统一数据接入<br />
              <span className="text-[#007AFF]">服务编排门户</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-xl mb-10">
              Northstar 为企业团队提供安全、可观测的数据服务接入层。
              一个入口，连接所有内部数据源与外部服务，简化集成流程，提升交付效率。
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007AFF] hover:bg-[#006ADF] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                浏览服务目录
                <ArrowRight size={14} />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-white/15 hover:border-white/30 text-neutral-300 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-200"
              >
                联系平台团队
              </a>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 px-6 bg-[#0f0f0f] border border-white/5 rounded-xl">
          <StatCard value="99.9%" label="可用率" />
          <StatCard value="<50ms" label="平均延迟" />
          <StatCard value="128+" label="接入服务" />
          <StatCard value="24/7" label="运维保障" />
        </div>

        {/* ── Features ── */}
        <Section>
          <div id="features" className="scroll-mt-24">
            <SectionLabel>Core Features</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">核心能力</h2>
            <p className="text-neutral-400 text-base mb-8 leading-relaxed max-w-2xl">
              从数据接入到服务交付，Northstar 覆盖企业数据平台的关键环节。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon={Globe}
                title="统一接入网关"
                desc="多协议、多数据源的统一接入层，屏蔽底层差异，提供标准化访问接口。"
              />
              <FeatureCard
                icon={Shield}
                title="细粒度权限控制"
                desc="基于角色与策略的访问控制，支持 Token 鉴权、IP 白名单、速率限制等安全策略。"
              />
              <FeatureCard
                icon={Activity}
                title="实时可观测性"
                desc="内置请求追踪、性能指标与告警能力，全链路可视化，问题秒级定位。"
              />
              <FeatureCard
                icon={Database}
                title="数据源管理"
                desc="可视化管理内部与外部数据源，支持连接池、健康检查与自动故障转移。"
              />
              <FeatureCard
                icon={Zap}
                title="服务编排引擎"
                desc="声明式服务编排，支持串行、并行、条件分支等执行模式，降低集成复杂度。"
              />
              <FeatureCard
                icon={BarChart3}
                title="用量分析看板"
                desc="按团队、项目、服务维度统计资源消耗与调用趋势，辅助容量规划与成本优化。"
              />
            </div>
          </div>
        </Section>

        {/* ── Service Catalog ── */}
        <Section>
          <div id="services" className="scroll-mt-24">
            <SectionLabel>Service Catalog</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">服务目录</h2>
            <p className="text-neutral-400 text-base mb-8 leading-relaxed max-w-2xl">
              平台当前接入的核心服务一览。如需新增接入，请联系平台团队。
            </p>

            <div className="space-y-2">
              <ServiceRow
                icon={Database}
                name="结构化数据查询服务"
                status="active"
                desc="SQL / GraphQL 接口，覆盖主要业务数据库"
              />
              <ServiceRow
                icon={Globe}
                name="外部 API 聚合网关"
                status="active"
                desc="统一代理外部第三方接口，规避跨域与频率限制"
              />
              <ServiceRow
                icon={Users}
                name="统一身份认证服务"
                status="active"
                desc="SSO 单点登录与 Token 管理，支持 OIDC / SAML 协议"
              />
              <ServiceRow
                icon={BarChart3}
                name="实时数据分析引擎"
                status="active"
                desc="流式与批式分析，毫秒级数据聚合与指标计算"
              />
              <ServiceRow
                icon={Lock}
                name="密钥与凭证托管"
                status="active"
                desc="集中管理服务凭证、API Key 与证书，自动轮换"
              />
              <ServiceRow
                icon={Layers}
                name="服务编排工作流"
                status="active"
                desc="可视化编排多步骤数据处理流水线"
              />
            </div>
          </div>
        </Section>

        {/* ── Contact ── */}
        <Section>
          <div id="contact" className="scroll-mt-24">
            <SectionLabel>Contact</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">联系平台团队</h2>
            <p className="text-neutral-400 text-base mb-8 leading-relaxed max-w-2xl">
              如需开通服务、咨询技术方案或反馈问题，请留下您的邮箱，我们会在一个工作日内回复。
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#121212] border border-white/10 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#007AFF]/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#006ADF] text-white text-sm font-semibold rounded-lg transition-colors duration-200 shrink-0"
              >
                提交
              </button>
            </form>
          </div>
        </Section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/10 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#007AFF] rounded flex items-center justify-center">
                <Layers size={10} className="text-white" />
              </div>
              <span className="text-neutral-600 text-xs font-mono">Northstar Data Portal</span>
            </div>
            <p className="text-neutral-600 text-xs font-mono text-center">
              &copy; 2024 — 2026 Northstar Team &nbsp;&middot;&nbsp; Internal Use Only
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
