import { useEffect, useState } from 'react';
import api from '../services/api';
import { MessageCircle, Phone, Mail } from 'lucide-react';

interface SiteContent {
  page: string; title: string; subtitle: string; body: string;
  sections: { heading: string; content: string }[];
}

const defaults: SiteContent = {
  page: 'contact',
  title: 'Contact us',
  subtitle: 'Reach out to discuss inquiries, pricing, or pickup arrangements.',
  body: '',
  sections: [
    { heading: 'Phone', content: '0708309429' },
    { heading: 'WhatsApp', content: '0708309429' },
    { heading: 'Email', content: 'alextronics.shop01@gmail.com' }
  ]
};

const sectionIcons: Record<string, typeof Phone> = { Phone, WhatsApp: MessageCircle, Email: Mail };

function ContactPage() {
  const [content, setContent] = useState<SiteContent>(defaults);

  useEffect(() => {
    api.get<SiteContent>('/site/contact').then((res) => { if (res.data.title) setContent(res.data); }).catch(() => {});
  }, []);

  return (
    <div className="pt-24">
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-charcoal leading-tight">{content.title}</h1>
          <p className="mt-4 text-lg text-soft">{content.subtitle}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {content.sections.map((section, i) => {
            const Icon = sectionIcons[section.heading] || Phone;
            const isWhatsApp = section.heading === 'WhatsApp';
            const isEmail = section.heading === 'Email';
            const isPhone = section.heading === 'Phone';
            const href = isWhatsApp ? `https://wa.me/${section.content.replace(/[^0-9]/g, '')}` : isEmail ? `mailto:${section.content}` : isPhone ? `tel:${section.content}` : null;
            const Wrapper = href ? 'a' : 'div';

            return (
              <Wrapper key={i} href={href || undefined} target={isWhatsApp ? '_blank' : undefined} rel={isWhatsApp ? 'noreferrer' : undefined}
                className="text-center p-8 rounded-2xl bg-white border border-border/60 hover:shadow-soft transition group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  {Icon && <Icon size={24} className="text-primary" />}
                </div>
                <h2 className="text-lg font-semibold text-charcoal mb-2">{section.heading}</h2>
                <p className="text-sm text-soft break-all">{section.content}</p>
              </Wrapper>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
