// ==============================================
// ADMIN DASHBOARD JAVASCRIPT
// ==============================================

// Tab Navigation
function showTab(tabName) {
    // Update sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-link[data-tab="${tabName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  
    // Load tab data
    switch(tabName) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'students':
        loadStudents();
        break;
      case 'teachers':
        loadTeachers();
        break;
      case 'classes':
        loadClasses();
        break;
      case 'payments':
        loadPayments();
        break;
      case 'attendance':
        loadLiveClasses();
        break;
      case 'cards':
        loadCards();
        break;
      case 'reports':
        loadReports();
        break;
    }
  }
  
  // ==============================================
  // DASHBOARD
  // ==============================================
  async function loadDashboard() {
    try {
      // Load stats
      const stats = await Promise.all([
        apiRequest('/api/count/students'),
        apiRequest('/api/count/teachers'),
        apiRequest('/api/count/classes'),
        apiRequest('/api/payments/count?status=pending')
      ]);
  
      document.getElementById('total-students').textContent = stats[0]?.count || 0;
      document.getElementById('total-teachers').textContent = stats[1]?.count || 0;
      document.getElementById('total-classes').textContent = stats[2]?.count || 0;
      document.getElementById('pending-payments').textContent = stats[3]?.count || 0;
  
      // Load recent students
      const students = await apiRequest('/api/students?limit=5');
      const recentStudents = document.getElementById('recent-students');
      if (students && students.length) {
        recentStudents.innerHTML = students.slice(0, 5).map(student => `
          <tr>
            <td>${student.name}</td>
            <td>${student.studentId || '-'}</td>
            <td>${formatDate(student.registrationDate)}</td>
            <td>${getStatusBadge(student.status)}</td>
          </tr>
        `).join('');
      }
  
      // Load recent payments
      const payments = await apiRequest('/api/payments?limit=5');
      const recentPayments = document.getElementById('recent-payments');
      if (payments && payments.length) {
        recentPayments.innerHTML = payments.slice(0, 5).map(payment => `
          <tr>
            <td>${payment.student?.name || '-'}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>${payment.month || '-'}</td>
            <td>${getStatusBadge(payment.status)}</td>
          </tr>
        `).join('');
      }
  
      // Load today's classes
      const todayClasses = await apiRequest('/api/live-classes/today');
      const todayClassesList = document.getElementById('today-classes');
      if (todayClasses && todayClasses.length) {
        todayClassesList.innerHTML = todayClasses.map(lc => `
          <tr>
            <td>${lc.name}</td>
            <td>${lc.subject}</td>
            <td>${lc.teacher}</td>
            <td>${lc.time}</td>
            <td>${lc.classroom}</td>
            <td>${lc.studentsCount || 0}</td>
          </tr>
        `).join('');
      } else {
        todayClassesList.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد حصص اليوم</td></tr>';
      }
  
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }
  
  // ==============================================
  // STUDENTS MANAGEMENT
  // ==============================================
  let students = [];
  
  async function loadStudents() {
    try {
      students = await apiRequest('/api/students') || [];
      renderStudentsTable();
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }
  
  function renderStudentsTable() {
    const studentsList = document.getElementById('students-list');
    
    if (!students || students.length === 0) {
      studentsList.innerHTML = '<tr><td colspan="8" class="text-center">لا يوجد طلاب</td></tr>';
      return;
    }
  
    studentsList.innerHTML = students.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.studentId || '-'}</td>
        <td>${student.name}</td>
        <td>${student.academicYear || '-'}</td>
        <td>${student.parentName || '-'}</td>
        <td>${student.parentPhone || '-'}</td>
        <td>${getStatusBadge(student.status)}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewStudent('${student._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="editStudent('${student._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  function searchStudents() {
    const searchTerm = document.getElementById('student-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('student-filter')?.value || '';
  
    const filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                           student.parentName?.toLowerCase().includes(searchTerm) ||
                           student.studentId?.toLowerCase().includes(searchTerm);
      
      const matchesFilter = !filter || student.status === filter;
      
      return matchesSearch && matchesFilter;
    });
  
    renderFilteredStudents(filtered);
  }
  
  function renderFilteredStudents(filtered) {
    const studentsList = document.getElementById('students-list');
    
    if (filtered.length === 0) {
      studentsList.innerHTML = '<tr><td colspan="8" class="text-center">لا توجد نتائج</td></tr>';
      return;
    }
  
    studentsList.innerHTML = filtered.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.studentId || '-'}</td>
        <td>${student.name}</td>
        <td>${student.academicYear || '-'}</td>
        <td>${student.parentName || '-'}</td>
        <td>${student.parentPhone || '-'}</td>
        <td>${getStatusBadge(student.status)}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewStudent('${student._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="editStudent('${student._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  function openAddStudentModal() {
    // Reset form
    document.getElementById('add-student-form').reset();
    openModal('add-student-modal');
  }
  
  async function addStudent() {
    const name = document.getElementById('student-name').value;
    const academicYear = document.getElementById('student-academic-year').value;
    const parentName = document.getElementById('student-parent-name').value;
    const parentPhone = document.getElementById('student-parent-phone').value;
    const email = document.getElementById('student-email').value;
    const birthDate = document.getElementById('student-birthdate').value;
  
    if (!name || !academicYear || !parentName || !parentPhone) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
  
    try {
      const result = await apiRequest('/api/students', 'POST', {
        name,
        academicYear,
        parentName,
        parentPhone,
        parentEmail: email,
        birthDate: birthDate || undefined
      });
  
      closeModal('add-student-modal');
      showToast('تم إضافة الطالب بنجاح', 'success');
      loadStudents(); // Reload students list
    } catch (error) {
      console.error('Error adding student:', error);
    }
  }
  
  async function viewStudent(studentId) {
    try {
      const student = await apiRequest(`/api/students/${studentId}`);
      
      document.getElementById('view-student-id').textContent = student.studentId || '-';
      document.getElementById('view-student-name').textContent = student.name;
      document.getElementById('view-student-academic-year').textContent = student.academicYear || '-';
      document.getElementById('view-student-parent-name').textContent = student.parentName || '-';
      document.getElementById('view-student-parent-phone').textContent = student.parentPhone || '-';
      document.getElementById('view-student-email').textContent = student.parentEmail || '-';
  
      // Load student's classes
      const classes = student.classes || [];
      const classesList = document.getElementById('view-student-classes-list');
      if (classes.length) {
        classesList.innerHTML = classes.map(cls => `
          <tr>
            <td>${cls.name}</td>
            <td>${cls.subject || '-'}</td>
            <td>${cls.teacher?.name || '-'}</td>
            <td>${formatCurrency(cls.price)}</td>
          </tr>
        `).join('');
      } else {
        classesList.innerHTML = '<tr><td colspan="4" class="text-center">غير مسجل في أي حصة</td></tr>';
      }
  
      // Load student's payments
      const payments = await apiRequest(`/api/payments/student/${studentId}`);
      const paymentsList = document.getElementById('view-student-payments-list');
      if (payments && payments.length) {
        paymentsList.innerHTML = payments.map(p => `
          <tr>
            <td>${p.class?.name || '-'}</td>
            <td>${formatCurrency(p.amount)}</td>
            <td>${p.month || '-'}</td>
            <td>${p.paymentDate ? formatDate(p.paymentDate) : '-'}</td>
            <td>${getStatusBadge(p.status)}</td>
          </tr>
        `).join('');
      } else {
        paymentsList.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد مدفوعات</td></tr>';
      }
  
      openModal('view-student-modal');
    } catch (error) {
      console.error('Error viewing student:', error);
    }
  }
  
  function editStudent(studentId) {
    // Implement edit student functionality
    showToast('جاري التطوير...', 'info');
  }
  
  async function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
  
    try {
      await apiRequest(`/api/students/${studentId}`, 'DELETE');
      showToast('تم حذف الطالب بنجاح', 'success');
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  }
  
  // ==============================================
  // TEACHERS MANAGEMENT
  // ==============================================
  let teachers = [];
  
  async function loadTeachers() {
    try {
      teachers = await apiRequest('/api/teachers') || [];
      renderTeachersTable();
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  }
  
  function renderTeachersTable() {
    const teachersList = document.getElementById('teachers-list');
    
    if (!teachers || teachers.length === 0) {
      teachersList.innerHTML = '<tr><td colspan="8" class="text-center">لا يوجد أساتذة</td></tr>';
      return;
    }
  
    teachersList.innerHTML = teachers.map((teacher, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${teacher.name}</td>
        <td>${(teacher.subjects || []).join(', ')}</td>
        <td>${teacher.phone || '-'}</td>
        <td>${teacher.email || '-'}</td>
        <td>${teacher.salaryPercentage * 100}%</td>
        <td>${getStatusBadge(teacher.active ? 'active' : 'inactive')}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewTeacher('${teacher._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="editTeacher('${teacher._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${teacher._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  function openAddTeacherModal() {
    document.getElementById('add-teacher-form').reset();
    openModal('add-teacher-modal');
  }
  
  async function addTeacher() {
    const name = document.getElementById('teacher-name').value;
    const subjects = Array.from(document.getElementById('teacher-subjects').selectedOptions).map(opt => opt.value);
    const phone = document.getElementById('teacher-phone').value;
    const email = document.getElementById('teacher-email').value;
    const percentage = document.getElementById('teacher-percentage').value / 100;
  
    if (!name || subjects.length === 0 || !phone) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
  
    try {
      const result = await apiRequest('/api/teachers', 'POST', {
        name,
        subjects,
        phone,
        email,
        salaryPercentage: percentage
      });
  
      closeModal('add-teacher-modal');
      showToast('تم إضافة الأستاذ بنجاح', 'success');
      loadTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
    }
  }
  
  async function deleteTeacher(teacherId) {
    if (!confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) return;
  
    try {
      await apiRequest(`/api/teachers/${teacherId}`, 'DELETE');
      showToast('تم حذف الأستاذ بنجاح', 'success');
      loadTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  }
  
  // ==============================================
  // CLASSES MANAGEMENT
  // ==============================================
  let classes = [];
  
  async function loadClasses() {
    try {
      classes = await apiRequest('/api/classes') || [];
      renderClassesTable();
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }
  
  function renderClassesTable() {
    const classesList = document.getElementById('classes-list');
    
    if (!classes || classes.length === 0) {
      classesList.innerHTML = '<tr><td colspan="9" class="text-center">لا توجد حصص</td></tr>';
      return;
    }
  
    classesList.innerHTML = classes.map((cls, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${cls.name}</td>
        <td>${cls.subject || '-'}</td>
        <td>${cls.academicYear || '-'}</td>
        <td>${cls.teacher?.name || '-'}</td>
        <td>${formatCurrency(cls.price)}</td>
        <td>${cls.paymentSystem === 'monthly' ? 'شهري' : 'جولات'}</td>
        <td>${cls.students?.length || 0}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewClass('${cls._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="editClass('${cls._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteClass('${cls._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  async function openAddClassModal() {
    // Load teachers for dropdown
    try {
      const teachers = await apiRequest('/api/teachers');
      const teacherSelect = document.getElementById('class-teacher');
      teacherSelect.innerHTML = '<option value="">اختر الأستاذ</option>';
      teachers.forEach(teacher => {
        teacherSelect.innerHTML += `<option value="${teacher._id}">${teacher.name}</option>`;
      });
  
      // Load classrooms
      const classrooms = await apiRequest('/api/classrooms');
      const classroomSelects = document.querySelectorAll('.schedule-classroom');
      classroomSelects.forEach(select => {
        select.innerHTML = '<option value="">اختر القاعة</option>';
        classrooms.forEach(classroom => {
          select.innerHTML += `<option value="${classroom._id}">${classroom.name}</option>`;
        });
      });
  
      // Reset form
      document.getElementById('add-class-form').reset();
      document.getElementById('round-settings').style.display = 'none';
      openModal('add-class-modal');
    } catch (error) {
      console.error('Error loading data for class modal:', error);
    }
  }
  
  function addScheduleItem() {
    const container = document.getElementById('schedule-container');
    const template = `
      <div class="schedule-item row mt-2">
        <div class="col">
          <select class="form-select schedule-day">
            <option value="السبت">السبت</option>
            <option value="الأحد">الأحد</option>
            <option value="الإثنين">الإثنين</option>
            <option value="الثلاثاء">الثلاثاء</option>
            <option value="الأربعاء">الأربعاء</option>
            <option value="الخميس">الخميس</option>
            <option value="الجمعة">الجمعة</option>
          </select>
        </div>
        <div class="col">
          <input type="time" class="form-control schedule-time" value="08:00">
        </div>
        <div class="col">
          <select class="form-select schedule-classroom">
            <option value="">اختر القاعة</option>
          </select>
        </div>
        <div class="col">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeScheduleItem(this)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', template);
  
    // Copy classroom options to new select
    const classroomsSelect = document.querySelector('.schedule-classroom');
    const newSelect = container.lastElementChild.querySelector('.schedule-classroom');
    newSelect.innerHTML = classroomsSelect.innerHTML;
  }
  
  function removeScheduleItem(button) {
    const item = button.closest('.schedule-item');
    if (document.querySelectorAll('.schedule-item').length > 1) {
      item.remove();
    } else {
      showToast('يجب أن تحتوي الحصة على موعد واحد على الأقل', 'warning');
    }
  }
  
  // Payment system change handler
  document.getElementById('class-payment-system')?.addEventListener('change', function(e) {
    const roundSettings = document.getElementById('round-settings');
    roundSettings.style.display = e.target.value === 'rounds' ? 'block' : 'none';
  });
  
  async function addClass() {
    const name = document.getElementById('class-name').value;
    const subject = document.getElementById('class-subject').value;
    const academicYear = document.getElementById('class-academic-year').value;
    const teacher = document.getElementById('class-teacher').value;
    const price = document.getElementById('class-price').value;
    const paymentSystem = document.getElementById('class-payment-system').value;
    const description = document.getElementById('class-description').value;
  
    // Get schedule
    const scheduleItems = document.querySelectorAll('.schedule-item');
    const schedule = Array.from(scheduleItems).map(item => ({
      day: item.querySelector('.schedule-day').value,
      time: item.querySelector('.schedule-time').value,
      classroom: item.querySelector('.schedule-classroom').value || null
    }));
  
    if (!name || !subject || !academicYear || !teacher || !price) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
  
    const classData = {
      name,
      subject,
      academicYear,
      teacher,
      price: parseFloat(price),
      paymentSystem,
      description,
      schedule
    };
  
    // Add round settings if needed
    if (paymentSystem === 'rounds') {
      classData.roundSettings = {
        sessionCount: parseInt(document.getElementById('round-session-count').value) || 8,
        sessionDuration: parseInt(document.getElementById('round-session-duration').value) || 2,
        breakBetweenSessions: 0
      };
    }
  
    try {
      const result = await apiRequest('/api/classes', 'POST', classData);
      closeModal('add-class-modal');
      showToast('تم إنشاء الحصة بنجاح', 'success');
      loadClasses();
    } catch (error) {
      console.error('Error adding class:', error);
    }
  }
  
  async function viewClass(classId) {
    try {
      const cls = await apiRequest(`/api/classes/${classId}`);
      
      document.getElementById('view-class-title').textContent = cls.name;
      document.getElementById('view-class-subject').textContent = cls.subject || '-';
      document.getElementById('view-class-teacher').textContent = cls.teacher?.name || '-';
      document.getElementById('view-class-price').textContent = formatCurrency(cls.price);
      document.getElementById('view-class-academic-year').textContent = cls.academicYear || '-';
      document.getElementById('view-class-payment-system').textContent = cls.paymentSystem === 'monthly' ? 'شهري' : 'جولات';
      document.getElementById('view-class-students-count').textContent = cls.students?.length || 0;
  
      // Schedule
      const scheduleList = document.getElementById('view-class-schedule-list');
      if (cls.schedule && cls.schedule.length) {
        scheduleList.innerHTML = cls.schedule.map(s => `
          <tr>
            <td>${s.day}</td>
            <td>${s.time}</td>
            <td>${s.classroom?.name || '-'}</td>
          </tr>
        `).join('');
      } else {
        scheduleList.innerHTML = '<tr><td colspan="3" class="text-center">لا يوجد جدول زمني</td></tr>';
      }
  
      // Students
      const studentsList = document.getElementById('view-class-students-list');
      if (cls.students && cls.students.length) {
        studentsList.innerHTML = cls.students.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.studentId || '-'}</td>
            <td>${s.parentName || '-'}</td>
            <td>${s.parentPhone || '-'}</td>
          </tr>
        `).join('');
      } else {
        studentsList.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد طلاب مسجلين</td></tr>';
      }
  
      // Payments
      const payments = await apiRequest(`/api/payments/class/${classId}`);
      const paymentsList = document.getElementById('view-class-payments-list');
      if (payments && payments.length) {
        paymentsList.innerHTML = payments.slice(0, 10).map(p => `
          <tr>
            <td>${p.student?.name || '-'}</td>
            <td>${formatCurrency(p.amount)}</td>
            <td>${p.month || '-'}</td>
            <td>${getStatusBadge(p.status)}</td>
          </tr>
        `).join('');
      } else {
        paymentsList.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد مدفوعات</td></tr>';
      }
  
      openModal('view-class-modal');
    } catch (error) {
      console.error('Error viewing class:', error);
    }
  }
  
  function editClass(classId) {
    showToast('جاري التطوير...', 'info');
  }
  
  async function deleteClass(classId) {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
  
    try {
      await apiRequest(`/api/classes/${classId}`, 'DELETE');
      showToast('تم حذف الحصة بنجاح', 'success');
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  }
  
  // ==============================================
  // PAYMENTS MANAGEMENT
  // ==============================================
  let payments = [];
  
  async function loadPayments() {
    try {
      payments = await apiRequest('/api/payments') || [];
      renderPaymentsTable();
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }
  
  function renderPaymentsTable() {
    const paymentsList = document.getElementById('payments-list');
    
    if (!payments || payments.length === 0) {
      paymentsList.innerHTML = '<tr><td colspan="9" class="text-center">لا توجد مدفوعات</td></tr>';
      return;
    }
  
    paymentsList.innerHTML = payments.map((payment, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${payment.student?.name || '-'}</td>
        <td>${payment.class?.name || '-'}</td>
        <td>${formatCurrency(payment.amount)}</td>
        <td>${payment.month || '-'}</td>
        <td>${payment.paymentDate ? formatDate(payment.paymentDate) : '-'}</td>
        <td>${payment.paymentMethod || '-'}</td>
        <td>${getStatusBadge(payment.status)}</td>
        <td>
          ${payment.status !== 'paid' ? `
            <button class="btn btn-sm btn-success" onclick="markPaymentPaid('${payment._id}')">
              <i class="fas fa-check"></i>
            </button>
          ` : ''}
          <button class="btn btn-sm btn-primary" onclick="printReceipt('${payment._id}')">
            <i class="fas fa-print"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deletePayment('${payment._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  async function openAddPaymentModal() {
    try {
      // Load students
      const students = await apiRequest('/api/students');
      const studentSelect = document.getElementById('payment-student');
      studentSelect.innerHTML = '<option value="">اختر الطالب</option>';
      students.forEach(student => {
        studentSelect.innerHTML += `<option value="${student._id}">${student.name}</option>`;
      });
  
      // Load classes
      const classes = await apiRequest('/api/classes');
      const classSelect = document.getElementById('payment-class');
      classSelect.innerHTML = '<option value="">اختر الحصة</option>';
      classes.forEach(cls => {
        classSelect.innerHTML += `<option value="${cls._id}">${cls.name}</option>`;
      });
  
      // Set current month
      const now = new Date();
      const monthInput = document.getElementById('payment-month');
      monthInput.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
      openModal('add-payment-modal');
    } catch (error) {
      console.error('Error loading data for payment modal:', error);
    }
  }
  
  async function addPayment() {
    const student = document.getElementById('payment-student').value;
    const classId = document.getElementById('payment-class').value;
    const amount = document.getElementById('payment-amount').value;
    const month = document.getElementById('payment-month').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const notes = document.getElementById('payment-notes').value;
  
    if (!student || !amount || !month) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
  
    try {
      const result = await apiRequest('/api/payments', 'POST', {
        student,
        class: classId,
        amount: parseFloat(amount),
        month,
        paymentMethod,
        notes
      });
  
      closeModal('add-payment-modal');
      showToast('تم تسجيل الدفعة بنجاح', 'success');
      loadPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  }
  
  async function markPaymentPaid(paymentId) {
    try {
      const result = await apiRequest(`/api/payments/${paymentId}/pay`, 'PUT', {
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString()
      });
  
      showToast('تم تأكيد الدفع بنجاح', 'success');
      loadPayments();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  }
  
  async function printReceipt(paymentId) {
    try {
      const payment = await apiRequest(`/api/payments/${paymentId}`);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>إيصال دفع</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .details p { margin: 5px 0; }
            .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>إيصال دفع</h2>
              <p>رقم: ${payment.invoiceNumber || 'N/A'}</p>
            </div>
            <div class="details">
              <p><strong>الطالب:</strong> ${payment.student?.name || '-'}</p>
              <p><strong>الحصة:</strong> ${payment.class?.name || '-'}</p>
              <p><strong>الشهر:</strong> ${payment.month || '-'}</p>
              <p><strong>تاريخ الدفع:</strong> ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : '-'}</p>
              <p><strong>طريقة الدفع:</strong> ${payment.paymentMethod || '-'}</p>
              <p><strong>المبلغ:</strong> <span class="amount">${formatCurrency(payment.amount)}</span></p>
            </div>
            <div class="footer">
              <p>شكراً لثقتكم</p>
              <p>نظام إدارة المدرسة</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  }
  
  async function deletePayment(paymentId) {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
  
    try {
      await apiRequest(`/api/payments/${paymentId}`, 'DELETE');
      showToast('تم حذف الدفعة بنجاح', 'success');
      loadPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  }
  
  // ==============================================
  // ATTENDANCE MANAGEMENT
  // ==============================================
  async function loadLiveClasses() {
    try {
      const liveClasses = await apiRequest('/api/live-classes/today') || [];
      const liveClassesList = document.getElementById('live-classes-list');
      
      if (liveClasses.length) {
        liveClassesList.innerHTML = liveClasses.map(lc => `
          <tr>
            <td>${lc.name}</td>
            <td>${lc.teacher}</td>
            <td>${lc.time}</td>
            <td>${lc.classroom}</td>
            <td>${getStatusBadge(lc.isScheduled ? 'scheduled' : lc.status)}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="manageAttendance('${lc._id}')">
                <i class="fas fa-clipboard-list"></i>
                إدارة الحضور
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        liveClassesList.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد حصص اليوم</td></tr>';
      }
    } catch (error) {
      console.error('Error loading live classes:', error);
    }
  }
  
  async function openScheduleClassModal() {
    try {
      // Load classes
      const classes = await apiRequest('/api/classes');
      const classSelect = document.getElementById('live-class-class');
      classSelect.innerHTML = '<option value="">اختر الحصة</option>';
      classes.forEach(cls => {
        classSelect.innerHTML += `<option value="${cls._id}">${cls.name}</option>`;
      });
  
      // Load teachers
      const teachers = await apiRequest('/api/teachers');
      const teacherSelect = document.getElementById('live-class-teacher');
      teacherSelect.innerHTML = '<option value="">اختر الأستاذ</option>';
      teachers.forEach(teacher => {
        teacherSelect.innerHTML += `<option value="${teacher._id}">${teacher.name}</option>`;
      });
  
      // Load classrooms
      const classrooms = await apiRequest('/api/classrooms');
      const classroomSelect = document.getElementById('live-class-classroom');
      classroomSelect.innerHTML = '<option value="">اختر القاعة</option>';
      classrooms.forEach(classroom => {
        classroomSelect.innerHTML += `<option value="${classroom._id}">${classroom.name}</option>`;
      });
  
      // Set today's date
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('live-class-date').value = today;
  
      openModal('schedule-class-modal');
    } catch (error) {
      console.error('Error loading data for schedule modal:', error);
    }
  }
  
  async function scheduleLiveClass() {
    const classId = document.getElementById('live-class-class').value;
    const date = document.getElementById('live-class-date').value;
    const startTime = document.getElementById('live-class-start-time').value;
    const endTime = document.getElementById('live-class-end-time').value;
    const teacher = document.getElementById('live-class-teacher').value;
    const classroom = document.getElementById('live-class-classroom').value;
    const notes = document.getElementById('live-class-notes').value;
  
    if (!classId || !date || !startTime || !endTime || !teacher) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
  
    try {
      const result = await apiRequest('/api/live-classes/schedule', 'POST', {
        classId,
        date,
        startTime,
        endTime,
        teacherId: teacher,
        classroomId: classroom || null,
        notes
      });
  
      closeModal('schedule-class-modal');
      showToast('تم جدولة الحصة بنجاح', 'success');
      loadLiveClasses();
    } catch (error) {
      console.error('Error scheduling class:', error);
    }
  }
  
  function manageAttendance(liveClassId) {
    // Navigate to attendance management page
    window.location.href = `/attendance.html?class=${liveClassId}`;
  }
  
  // ==============================================
  // CARDS MANAGEMENT
  // ==============================================
  async function loadCards() {
    try {
      const cards = await apiRequest('/api/cards') || [];
      const cardsList = document.getElementById('cards-list');
      
      if (cards.length) {
        cardsList.innerHTML = cards.map((card, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${card.uid}</td>
            <td>${card.student?.name || '-'}</td>
            <td>${formatDate(card.issueDate)}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="deleteCard('${card._id}')">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        cardsList.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بطاقات</td></tr>';
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  }
  
  async function openAddCardModal() {
    try {
      const students = await apiRequest('/api/students');
      const studentSelect = document.getElementById('card-student');
      studentSelect.innerHTML = '<option value="">اختر الطالب</option>';
      students.forEach(student => {
        studentSelect.innerHTML += `<option value="${student._id}">${student.name}</option>`;
      });
  
      openModal('add-card-modal');
    } catch (error) {
      console.error('Error loading students for card modal:', error);
    }
  }
  
  async function addCard() {
    const uid = document.getElementById('card-uid').value;
    const student = document.getElementById('card-student').value;
  
    if (!uid || !student) {
      showToast('يرجى إدخال UID البطاقة واختيار الطالب', 'warning');
      return;
    }
  
    try {
      const result = await apiRequest('/api/cards', 'POST', { uid, student });
      closeModal('add-card-modal');
      showToast('تم إضافة البطاقة بنجاح', 'success');
      loadCards();
    } catch (error) {
      console.error('Error adding card:', error);
    }
  }
  
  async function deleteCard(cardId) {
    if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
  
    try {
      await apiRequest(`/api/cards/${cardId}`, 'DELETE');
      showToast('تم حذف البطاقة بنجاح', 'success');
      loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  }
  
  // ==============================================
  // REPORTS
  // ==============================================
  let charts = {};
  
  async function loadReports() {
    try {
      // Destroy existing charts
      Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
      });
  
      // Load daily income chart
      const dailyIncomeData = await apiRequest('/api/accounting/daily-income');
      if (dailyIncomeData && dailyIncomeData.dailyIncome) {
        const ctx = document.getElementById('daily-income-chart').getContext('2d');
        charts.dailyIncome = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['اليوم'],
            datasets: [{
              label: 'الدخل اليومي',
              data: [dailyIncomeData.dailyIncome],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            }
          }
        });
      }
  
      // Load expenses chart
      const expenses = await apiRequest('/api/accounting/expenses?limit=10');
      if (expenses && expenses.length) {
        const ctx = document.getElementById('expenses-chart').getContext('2d');
        charts.expenses = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: expenses.slice(0, 5).map(e => e.category),
            datasets: [{
              label: 'المصروفات',
              data: expenses.slice(0, 5).map(e => e.amount),
              backgroundColor: '#ef4444'
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            }
          }
        });
      }
  
      // Load attendance chart
      const attendanceStats = await apiRequest('/api/attendance/today-stats');
      if (attendanceStats) {
        const ctx = document.getElementById('attendance-chart').getContext('2d');
        charts.attendance = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['حاضر', 'غائب', 'متأخر'],
            datasets: [{
              data: [attendanceStats.present || 0, attendanceStats.absent || 0, attendanceStats.late || 0],
              backgroundColor: ['#22c55e', '#ef4444', '#f59e0b']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            }
          }
        });
      }
  
      // Load payments chart
      const payments = await apiRequest('/api/payments');
      if (payments && payments.length) {
        const paid = payments.filter(p => p.status === 'paid').length;
        const pending = payments.filter(p => p.status === 'pending').length;
        const late = payments.filter(p => p.status === 'late').length;
  
        const ctx = document.getElementById('payments-chart').getContext('2d');
        charts.payments = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['مدفوع', 'معلق', 'متأخر'],
            datasets: [{
              data: [paid, pending, late],
              backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' }
            }
          }
        });
      }
  
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth('admin')) {
      loadDashboard();
      
      // Add sidebar toggle for mobile
      const sidebarToggle = document.getElementById('sidebar-toggle');
      const sidebar = document.getElementById('sidebar');
      
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
          sidebar.classList.toggle('show');
        });
      }
  
      // Add click handlers for sidebar links
      document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tab = link.dataset.tab;
          if (tab) {
            showTab(tab);
          }
        });
      });
  
      // Add search input handler
      const searchInput = document.getElementById('student-search');
      if (searchInput) {
        searchInput.addEventListener('input', searchStudents);
      }
  
      const filterSelect = document.getElementById('student-filter');
      if (filterSelect) {
        filterSelect.addEventListener('change', searchStudents);
      }
    }
  });