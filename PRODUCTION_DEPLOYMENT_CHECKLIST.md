# 🚀 Production Deployment Checklist

**Purpose**: Comprehensive pre-launch checklist for deploying the Dual-Domain LLM Platform to production.

**Target Platforms**: Vercel (recommended), AWS, Google Cloud, self-hosted
**Estimated Time**: 4-6 hours (first deployment)
**Last Updated**: November 6, 2025

---

## 🔴 CRITICAL - Security (MUST DO FIRST)

### **1. API Key Rotation** ⚠️ URGENT

- [ ] **RunPod API Key**
  - [ ] Go to https://www.runpod.io/console/user/settings
  - [ ] Revoke exposed key (starts with `rpa_ATH56...`)
  - [ ] Generate new key
  - [ ] Store in password manager
  - [ ] Add to production environment variables

- [ ] **HuggingFace Tokens**
  - [ ] Go to https://huggingface.co/settings/tokens
  - [ ] Revoke exposed tokens (`hf_ABUMi...`, `hf_XsNlH...`)
  - [ ] Generate new tokens for each organization:
    - [ ] SwaggyStacks token
    - [ ] ScientiaCapital token
  - [ ] Add to production environment variables

- [ ] **Supabase Credentials**
  - [ ] Generate production Supabase project
  - [ ] Get production URL and anon key
  - [ ] Configure RLS (Row Level Security) policies
  - [ ] Add to production environment variables

- [ ] **API Key Audit**
  ```bash
  # Scan for any remaining exposed secrets
  grep -r "rpa_\|hf_\|sk-\|ghp_" . --exclude-dir=node_modules --exclude-dir=.git
  # Should return ZERO results
  ```

### **2. Environment Variables Validation**

- [ ] Create `.env.production` with ALL required variables:
  ```bash
  # Authentication
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Model Services
  RUNPOD_API_KEY=
  RUNPOD_BASE_URL=https://api.runpod.io/v2
  HUGGINGFACE_API_KEY=
  SWAGGYSTACKS_HF_TOKEN=
  SCIENTIACAPITAL_HF_TOKEN=

  # AI Model APIs (Optional)
  ANTHROPIC_API_KEY=
  OPENAI_API_KEY=
  GOOGLE_API_KEY=

  # Application
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=https://yourdomain.com

  # Monitoring (if using)
  SENTRY_DSN=
  DATADOG_API_KEY=
  ```

- [ ] Validate all required variables are set
  ```bash
  npm run validate-env  # Create this script
  ```

### **3. Git Security**

- [ ] **Clean Git History** (Optional but recommended)
  ```bash
  # Use BFG Repo-Cleaner to remove exposed secrets from history
  bfg --replace-text passwords.txt
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [ ] **Prevent Future Leaks**
  - [ ] Install pre-commit hooks:
    ```bash
    npm install --save-dev @commitlint/cli husky
    npx husky install
    npx husky add .husky/pre-commit "npx secretlint '**/*'"
    ```

---

## 🟡 HIGH PRIORITY - Infrastructure

### **4. Database Setup (Supabase)**

- [ ] **Create Production Project**
  - [ ] Create new project at https://app.supabase.com
  - [ ] Choose region closest to users
  - [ ] Select appropriate plan (Pro recommended for production)

- [ ] **Run Migrations**
  ```bash
  # Ensure all tables exist
  npx supabase db push --db-url="postgresql://..."
  ```

- [ ] **Configure RLS (Row Level Security)**
  - [ ] Enable RLS on all tables
  - [ ] Test policies thoroughly:
    ```sql
    -- Example: Users can only see their own organizations
    CREATE POLICY "Users see own orgs" ON organizations
      FOR SELECT USING (
        auth.uid() IN (
          SELECT user_id FROM user_organizations
          WHERE organization_id = id
        )
      );
    ```

- [ ] **Set up Backups**
  - [ ] Enable automated backups (daily minimum)
  - [ ] Test restore procedure
  - [ ] Document recovery process

### **5. Deployment Platform Setup**

#### **Option A: Vercel (Recommended)**

- [ ] **Initial Setup**
  - [ ] Connect GitHub repository
  - [ ] Configure build settings:
    ```json
    {
      "buildCommand": "npm run build",
      "outputDirectory": ".next",
      "installCommand": "npm install"
    }
    ```
  - [ ] Set environment variables in Vercel dashboard

- [ ] **Domain Configuration**
  - [ ] Add custom domains:
    - [ ] swaggystacks.com
    - [ ] scientiacapital.com
  - [ ] Configure DNS records (A/CNAME)
  - [ ] Enable HTTPS (automatic with Vercel)
  - [ ] Test both domains

- [ ] **Performance Settings**
  - [ ] Enable Edge Functions for API routes
  - [ ] Configure ISR (Incremental Static Regeneration) if needed
  - [ ] Set up edge caching rules

#### **Option B: Self-Hosted (Docker)**

- [ ] **Containerization**
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

- [ ] **Deploy with Docker Compose**
  ```yaml
  version: '3.8'
  services:
    app:
      build: .
      ports:
        - "3000:3000"
      environment:
        - NODE_ENV=production
      restart: unless-stopped
  ```

### **6. Monitoring & Logging**

- [ ] **Application Performance Monitoring**
  - [ ] Set up Vercel Analytics (free)
  - [ ] OR set up Sentry for error tracking
  - [ ] Configure alert thresholds

- [ ] **Logging**
  - [ ] Configure structured logging:
    ```typescript
    import { logger } from '@/lib/logger'
    logger.info('Deployment started', { userId, modelId })
    logger.error('Deployment failed', { error, stack })
    ```
  - [ ] Ship logs to aggregator (Datadog, CloudWatch, etc.)

- [ ] **Health Checks**
  - [ ] Test `/api/health` endpoint
  - [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
  - [ ] Configure status page (Statuspage.io)

### **7. Performance Optimization**

- [ ] **Build Optimization**
  ```bash
  # Analyze bundle size
  npm run build:analyze

  # Optimize if bundle > 500KB
  # - Enable tree shaking
  # - Lazy load components
  # - Optimize images
  ```

- [ ] **CDN Configuration**
  - [ ] Enable CDN for static assets
  - [ ] Configure cache headers
  - [ ] Optimize image delivery (Next.js Image Optimization)

- [ ] **Database Performance**
  - [ ] Add indexes on frequently queried columns
  - [ ] Enable connection pooling
  - [ ] Configure query timeout limits

---

## 🟢 IMPORTANT - Application

### **8. Feature Flags**

- [ ] **Implement Feature Toggles**
  ```typescript
  // Allow gradual rollout of features
  const FEATURE_FLAGS = {
    enableChineseLLMs: process.env.FEATURE_CHINESE_LLMS === 'true',
    enableRunPodDeployment: process.env.FEATURE_RUNPOD === 'true',
    enableMFA: process.env.FEATURE_MFA === 'true',
  }
  ```

- [ ] **Test Feature Rollout**
  - [ ] Deploy with all features disabled
  - [ ] Enable features one by one
  - [ ] Monitor for issues after each enable

### **9. Testing in Production-Like Environment**

- [ ] **Staging Environment**
  - [ ] Deploy to staging first (staging.yourdomain.com)
  - [ ] Run full test suite:
    ```bash
    npm run test:unit
    npm run test:e2e
    npm run test:integration
    ```

- [ ] **Load Testing**
  ```bash
  # Use k6 or Apache Bench
  k6 run load-test.js
  ```
  - [ ] Test with 100 concurrent users
  - [ ] Test model deployment flow
  - [ ] Test authentication flow
  - [ ] Identify bottlenecks

- [ ] **Security Testing**
  - [ ] Run OWASP security scan
  - [ ] Test for SQL injection
  - [ ] Test for XSS vulnerabilities
  - [ ] Verify CORS configuration
  - [ ] Test rate limiting

### **10. Documentation**

- [ ] **Update README.md**
  - [ ] Add production deployment instructions
  - [ ] Document environment variables
  - [ ] Add troubleshooting section

- [ ] **API Documentation**
  - [ ] Document all API endpoints
  - [ ] Provide example requests/responses
  - [ ] Add rate limit information

- [ ] **Runbook**
  - [ ] Create incident response playbook
  - [ ] Document common issues and solutions
  - [ ] Add rollback procedures

---

## 🚀 DEPLOYMENT DAY

### **11. Pre-Deployment Checklist**

- [ ] **Final Code Review**
  - [ ] All PRs merged to main
  - [ ] No console.log statements in production code
  - [ ] All TODO comments addressed or documented
  - [ ] Code coverage > 70%

- [ ] **Backup Current State**
  ```bash
  # Tag current version
  git tag -a v1.0.0-pre-production -m "Pre-production snapshot"
  git push --tags

  # Backup database
  npx supabase db dump > backup-$(date +%Y%m%d).sql
  ```

- [ ] **Communication**
  - [ ] Notify team of deployment window
  - [ ] Prepare rollback plan
  - [ ] Have support ready for issues

### **12. Deployment Steps**

1. **Deploy to Staging** (30 minutes)
   - [ ] Push to staging branch
   - [ ] Run automated tests
   - [ ] Manual smoke testing
   - [ ] Verify all features work

2. **Deploy to Production** (15 minutes)
   - [ ] Merge to main branch
   - [ ] Trigger production deployment
   - [ ] Monitor build logs
   - [ ] Verify deployment success

3. **Smoke Testing** (30 minutes)
   - [ ] Test homepage loads (both domains)
   - [ ] Test authentication flow
   - [ ] Test organization switching
   - [ ] Test model marketplace
   - [ ] Test model deployment (if enabled)
   - [ ] Test chat interface

4. **Monitor** (First 2 hours)
   - [ ] Watch error rates
   - [ ] Monitor response times
   - [ ] Check CPU/memory usage
   - [ ] Review user feedback

### **13. Post-Deployment**

- [ ] **Verify Everything Works**
  ```bash
  # Run production health checks
  curl https://yourdomain.com/api/health
  curl https://swaggystacks.com/api/health
  curl https://scientiacapital.com/api/health
  ```

- [ ] **Performance Baseline**
  - [ ] Record initial metrics:
    - [ ] Page load time
    - [ ] Time to first byte
    - [ ] API response times
  - [ ] Set up alerts if metrics degrade

- [ ] **User Communication**
  - [ ] Announce launch
  - [ ] Provide support channels
  - [ ] Gather initial feedback

---

## 🔄 ROLLBACK PROCEDURES

### **If Something Goes Wrong**

**Severity Level 1: Minor Issues** (Performance degradation, non-critical bugs)
- Monitor and fix in next deployment
- No immediate action needed

**Severity Level 2: Major Issues** (Critical feature broken, affecting some users)
```bash
# Rollback to previous version
vercel rollback  # On Vercel
# OR
git revert HEAD
git push origin main
```

**Severity Level 3: Critical** (Site down, data loss risk, security breach)
```bash
# IMMEDIATE rollback
vercel rollback --force

# Restore database if needed
psql < backup-20251106.sql

# Notify all stakeholders
# Investigate and fix before redeploying
```

---

## 📊 Post-Launch Monitoring (First Week)

### **Daily Checks**

- [ ] **Day 1**
  - [ ] Check error rates (should be < 1%)
  - [ ] Review user sign-ups
  - [ ] Monitor API usage
  - [ ] Check for security alerts

- [ ] **Day 2-3**
  - [ ] Review performance metrics
  - [ ] Analyze user behavior
  - [ ] Address reported issues

- [ ] **Day 4-7**
  - [ ] Collect user feedback
  - [ ] Plan iteration priorities
  - [ ] Document lessons learned

### **Metrics to Track**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | > 99.9% | < 99.5% |
| Error Rate | < 1% | > 2% |
| API Response Time | < 500ms | > 1000ms |
| Page Load Time | < 2s | > 3s |
| User Sign-ups | - | Track trend |
| Model Deployments | - | Track trend |

---

## ✅ LAUNCH CHECKLIST SUMMARY

### **Before Deployment**
- [x] Security: All API keys rotated
- [x] Environment: All variables configured
- [x] Database: Supabase setup complete
- [x] Tests: All passing
- [x] Monitoring: Setup complete
- [x] Documentation: Up to date

### **During Deployment**
- [x] Staging: Tested successfully
- [x] Production: Deployed successfully
- [x] Smoke Tests: All passing
- [x] Monitoring: Active and alerting

### **After Deployment**
- [x] Health Checks: All passing
- [x] Performance: Within targets
- [x] Team: Notified
- [x] Users: Can access site
- [x] Support: Ready for issues

---

## 🎓 Lessons Learned Template

After first production deployment, document:

**What Went Well**:
-

**What Could Be Improved**:
-

**Action Items for Next Deployment**:
1.
2.
3.

---

## 📞 Emergency Contacts

**Technical**:
- DevOps Lead: [Contact]
- Database Admin: [Contact]
- Security Lead: [Contact]

**Business**:
- Product Owner: [Contact]
- Customer Support: [Contact]

**Third-Party Services**:
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- RunPod Support: support@runpod.io

---

## 🔗 Additional Resources

- **Vercel Deployment Docs**: https://vercel.com/docs/deployments/overview
- **Next.js Production Guide**: https://nextjs.org/docs/going-to-production
- **Supabase Production Guide**: https://supabase.com/docs/guides/platform/going-to-prod
- **Security Best Practices**: SECURITY_INCIDENT.md

---

**Ready for Launch?** 🚀

Review this checklist thoroughly, complete all items, then deploy with confidence!
