/* Pengesahan Permohonan - data contoh frontend sahaja */
document.addEventListener('DOMContentLoaded', function () {
  const records = [
    {id:'EF-001',module:'Pinjaman Fail',name:'Ahmad Firdaus',department:'Bahagian Sumber Manusia',date:'11/11/2026',status:'pending',details:[['Nombor Fail','JPM/BSM/2026/001'],['Tujuan Pinjaman','Rujukan urusan kerja'],['Tarikh Pinjaman','12/11/2026'],['Tarikh Pemulangan','19/11/2026']],document:'Surat_Permohonan_EF001.pdf',remarks:''},
    {id:'EF-002',module:'Pendaftaran Fail',name:'Siti Aisyah',department:'Bahagian Khidmat Pengurusan',date:'11/11/2026',status:'pending',details:[['Jenis Fail','Fail Rasmi'],['Tajuk Fail','Pengurusan Rekod 2026'],['Bahagian','BKP'],['Tarikh Permohonan','11/11/2026']],document:'Dokumen_Pendaftaran.pdf',remarks:''},
    {id:'EF-003',module:'Pergerakan Fail',name:'Muhammad Amir',department:'Bahagian Pengurusan',date:'10/11/2026',status:'pending',details:[['Nombor Fail','JPM/PA/2026/018'],['Lokasi Asal','Unit Rekod'],['Lokasi Baharu','Bahagian Pengurusan'],['Tujuan','Tindakan dan semakan']],document:'Borang_Pergerakan.pdf',remarks:''},
    {id:'EF-004',module:'Pinjaman Fail',name:'Nur Farah',department:'Bahagian Sumber Manusia',date:'09/11/2026',status:'approved',details:[['Nombor Fail','JPM/BSM/2026/014'],['Tujuan Pinjaman','Semakan dokumen'],['Tarikh Pinjaman','09/11/2026'],['Tarikh Pemulangan','16/11/2026']],document:'Lampiran_EF004.pdf',remarks:'Maklumat lengkap dan disahkan.'},
    {id:'EF-005',module:'Pendaftaran Fail',name:'Mohd Hakim',department:'Unit Pentadbiran',date:'08/11/2026',status:'rejected',details:[['Jenis Fail','Fail Rasmi'],['Tajuk Fail','Permohonan rekod'],['Bahagian','Pentadbiran'],['Tarikh Permohonan','08/11/2026']],document:'Dokumen_EF005.pdf',remarks:'Sila lengkapkan maklumat tajuk fail.'}
  ];
  const body=document.getElementById('approvalTableBody');
  if(!body) return;
  const modal=document.getElementById('approvalDetailModal');
  const search=document.getElementById('approvalSearch');
  const filter=document.getElementById('approvalModuleFilter');
  let activeTab='pending', selected=null;

  const labels={pending:'Menunggu Pengesahan',approved:'Diluluskan',rejected:'Ditolak'};
  const badgeClass={pending:'approval-status--pending',approved:'approval-status--approved',rejected:'approval-status--rejected'};
  const icon={pending:'bi-hourglass-split',approved:'bi-check-circle-fill',rejected:'bi-x-circle-fill'};

  function render(){
    const term=(search.value||'').toLowerCase().trim(), module=filter.value;
    const rows=records.filter(r=>(activeTab==='pending'?r.status==='pending':r.status!=='pending')&&(!module||r.module===module)&&[r.id,r.name,r.module,r.department].join(' ').toLowerCase().includes(term));
    body.innerHTML=rows.map(r=>`<tr>
      <td><span class="approval-id">${r.id}</span></td>
      <td>${r.module}</td>
      <td><b>${r.name}</b><div class="muted">${r.department}</div></td>
      <td>${r.date}</td>
      <td><span class="approval-status ${badgeClass[r.status]}"><i class="bi ${icon[r.status]}"></i>${labels[r.status]}</span></td>
      <td><button type="button" class="approval-view" data-review="${r.id}"><i class="bi bi-eye"></i> ${r.status==='pending'?'Semak':'Lihat'}</button></td>
    </tr>`).join('');
    document.getElementById('approvalEmpty').hidden=rows.length!==0;
    document.querySelector('.approval-table').style.display=rows.length?'table':'none';
    document.getElementById('approvalResultCount').textContent=`Memaparkan ${rows.length} rekod`;
    const pending=records.filter(r=>r.status==='pending').length;
    document.getElementById('approvalPendingCount').textContent=pending;
    document.getElementById('pendingTabCount').textContent=pending;
    document.getElementById('approvalApprovedCount').textContent=records.filter(r=>r.status==='approved').length;
    document.getElementById('approvalRejectedCount').textContent=records.filter(r=>r.status==='rejected').length;
  }
  function openDetail(id){
    selected=records.find(r=>r.id===id); if(!selected)return;
    document.getElementById('detailReference').textContent=selected.id;
    document.getElementById('detailApplicant').textContent=selected.name;
    document.getElementById('detailModule').textContent=selected.module;
    document.getElementById('detailDate').textContent=selected.date;
    document.getElementById('detailDepartment').textContent=selected.department;
    document.getElementById('detailDocument').textContent=selected.document;
    document.getElementById('detailStatus').innerHTML=`<span class="approval-status ${badgeClass[selected.status]}"><i class="bi ${icon[selected.status]}"></i>${labels[selected.status]}</span>`;
    document.getElementById('detailForm').innerHTML=selected.details.map(d=>`<div><span>${d[0]}</span><strong>${d[1]}</strong></div>`).join('');
    document.getElementById('approvalRemarks').value=selected.remarks||'';
    const pending=selected.status==='pending';
    document.getElementById('approvalActionSection').hidden=!pending;
    document.getElementById('approvalDetailActions').hidden=!pending;
    document.getElementById('approvalHistoryNote').hidden=pending;
    document.getElementById('approvalHistoryNote').textContent=pending?'':`Tindakan: ${labels[selected.status]}. Catatan Pentadbir: ${selected.remarks||'Tiada catatan.'}`;
    document.getElementById('approvalValidation').textContent='';
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
    document.body.classList.add('approval-modal-open');
  }
  function closeDetail(){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('approval-modal-open');selected=null;}
  document.querySelectorAll('[data-approval-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    activeTab=btn.dataset.approvalTab;
    document.querySelectorAll('[data-approval-tab]').forEach(tab=>{const on=tab===btn;tab.classList.toggle('is-active',on);tab.setAttribute('aria-selected',String(on));});
    render();
  }));
  search.addEventListener('input',render);filter.addEventListener('change',render);
  body.addEventListener('click',e=>{const btn=e.target.closest('[data-review]');if(btn)openDetail(btn.dataset.review);});
  modal.querySelectorAll('[data-close-approval]').forEach(btn=>btn.addEventListener('click',closeDetail));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))closeDetail();});
  function decide(status){
    if(!selected||selected.status!=='pending')return;
    const remarks=document.getElementById('approvalRemarks').value.trim();
    const validation=document.getElementById('approvalValidation');
    if(status==='rejected'&&!remarks){validation.textContent='Sila masukkan sebab penolakan sebelum meneruskan.';return;}
    const action=status==='approved'?'meluluskan':'menolak';
    if(!window.confirm(`Adakah anda pasti mahu ${action} permohonan ${selected.id}?`))return;
    selected.status=status;selected.remarks=remarks;
    closeDetail();render();
  }
  document.getElementById('approvalApprove').addEventListener('click',()=>decide('approved'));
  document.getElementById('approvalReject').addEventListener('click',()=>decide('rejected'));
  render();
});
