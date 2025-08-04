document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('editableTable').getElementsByTagName('tbody')[0];
    const addRowButton = document.getElementById('addRow');
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    const pageInfo = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // Modal elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const closeModalBtn = document.querySelector('.close');
    const recordDetails = document.getElementById('recordDetails');
    
    // Date picker
    const hiddenDatePicker = document.getElementById('hiddenDatePicker');
    
    // API Configuration
    const API_BASE_URL = 'https://jsonplaceholder.typicode.com';
    let tableData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 10;
    let searchTerm = '';
    let currentDeleteId = null;
    let currentEditingDateCell = null; // Track which date cell is being edited

    // Fetch data from API on page load
    fetchTableData();

    // Event Listeners
    addRowButton.addEventListener('click', function() {
        addNewRow();
    });

    rowsPerPageSelect.addEventListener('change', function() {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        renderTable();
        updatePagination();
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        searchTerm = this.value.toLowerCase().trim();
        performSearch();
    });

    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        performSearch();
        searchInput.focus();
    });

    // Handle Enter key in search input
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });

    // Modal event listeners
    confirmDeleteBtn.addEventListener('click', function() {
        if (currentDeleteId !== null) {
            performDelete(currentDeleteId);
            closeModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', function() {
        closeModal();
    });

    closeModalBtn.addEventListener('click', function() {
        closeModal();
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            closeModal();
        }
    });

    // Date picker event listener - Fixed
    hiddenDatePicker.addEventListener('change', function() {
        if (currentEditingDateCell && this.value) {
            const formattedDate = formatDateForDisplay(this.value);
            currentEditingDateCell.textContent = formattedDate;
            currentEditingDateCell.innerHTML = formattedDate; // Remove any HTML highlighting
            
            // Reset visual feedback
            currentEditingDateCell.style.backgroundColor = '';
            currentEditingDateCell.style.outline = '';
            
            // Handle the cell edit
            handleCellEdit(currentEditingDateCell);
            
            // Clear the current editing cell
            currentEditingDateCell = null;
        }
    });

    // Close date picker when clicking outside or pressing escape
    hiddenDatePicker.addEventListener('blur', function() {
        if (currentEditingDateCell) {
            currentEditingDateCell.style.backgroundColor = '';
            currentEditingDateCell.style.outline = '';
            currentEditingDateCell = null;
        }
    });

    // Perform search and filter data
    function performSearch() {
        if (searchTerm === '') {
            filteredData = [...tableData];
        } else {
            filteredData = tableData.filter(item => {
                return item.name.toLowerCase().includes(searchTerm) ||
                       item.age.toString().includes(searchTerm) ||
                       item.country.toLowerCase().includes(searchTerm) ||
                       item.date.toLowerCase().includes(searchTerm);
            });
        }
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // Fetch table data from API
    async function fetchTableData() {
        try {
            showLoadingState();
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = await response.json();
            
            // Transform API data to match our table structure
            tableData = users.map(user => ({
                id: user.id,
                name: user.name,
                age: Math.floor(Math.random() * 50) + 20,
                country: user.address.city || 'Unknown',
                date: generateRandomDate()
            }));
            
            filteredData = [...tableData];
            renderTable();
            updatePagination();
            hideLoadingState();
        } catch (error) {
            console.error('Error fetching data:', error);
            hideLoadingState();
            showErrorMessage('Failed to load data from API');
        }
    }

    // Generate random date for demo purposes
    function generateRandomDate() {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return formatDateForDisplay(randomDate.toISOString().split('T')[0]);
    }

    // Format date for display (DD/MM/YYYY)
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Format date for input (YYYY-MM-DD)
    function formatDateForInput(displayDate) {
        if (!displayDate) return '';
        const parts = displayDate.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
    }

    // Render table with pagination
    function renderTable() {
        table.innerHTML = '';
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0 && searchTerm !== '') {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; font-style: italic;">No results found for your search</td></tr>';
        } else if (pageData.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; font-style: italic;">No data available</td></tr>';
        } else {
            pageData.forEach(item => {
                const row = createTableRow(item);
                table.appendChild(row);
            });
        }
        
        updatePageInfo();
    }

    // Create a table row element with search highlighting
    function createTableRow(data) {
        const row = document.createElement('tr');
        row.dataset.id = data.id;
        
        // Highlight search terms in the data
        const highlightedName = highlightSearchTerm(data.name.toString(), searchTerm);
        const highlightedAge = highlightSearchTerm(data.age.toString(), searchTerm);
        const highlightedCountry = highlightSearchTerm(data.country.toString(), searchTerm);
        const highlightedDate = highlightSearchTerm(data.date.toString(), searchTerm);
        
        row.innerHTML = `
            <td contenteditable="true" data-field="name">${highlightedName}</td>
            <td contenteditable="true" data-field="age">${highlightedAge}</td>
            <td contenteditable="true" data-field="country">${highlightedCountry}</td>
            <td contenteditable="true" data-field="date">${highlightedDate}</td>
            <td><button class="deleteRow">Delete</button></td>
        `;
        
        // Attach events to the new row
        attachDeleteEvent(row.querySelector('.deleteRow'));
        attachEditEvents(row);
        
        return row;
    }

    // Highlight search terms in text
    function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || searchTerm === '') {
            return text;
        }
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Update pagination controls
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        
        // Update previous/next buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Generate page numbers
        generatePageNumbers(totalPages);
    }

    // Generate page number buttons
    function generatePageNumbers(totalPages) {
        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            addPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px 4px';
                pageNumbers.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px 4px';
                pageNumbers.appendChild(ellipsis);
            }
            addPageButton(totalPages);
        }
    }

    // Add page button
    function addPageButton(pageNum) {
        const button = document.createElement('button');
        button.textContent = pageNum;
        button.className = pageNum === currentPage ? 'active' : '';
        button.style.marginRight = '4px';
        button.addEventListener('click', function() {
            currentPage = pageNum;
            renderTable();
            updatePagination();
        });
        pageNumbers.appendChild(button);
    }

    // Update page info text
    function updatePageInfo() {
        const startIndex = (currentPage - 1) * rowsPerPage + 1;
        const endIndex = Math.min(currentPage * rowsPerPage, filteredData.length);
        const total = filteredData.length;
        const totalRecords = tableData.length;
        
        if (total === 0) {
            if (searchTerm !== '') {
                pageInfo.textContent = `No results found (${totalRecords} total entries)`;
            } else {
                pageInfo.textContent = 'Showing 0 to 0 of 0 entries';
            }
        } else {
            const searchText = searchTerm !== '' ? ` (filtered from ${totalRecords} total entries)` : '';
            pageInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${total} entries${searchText}`;
        }
    }

    // Add new row functionality
    function addNewRow() {
        const newId = Math.max(...tableData.map(item => item.id), 0) + 1;
        const today = new Date();
        const newData = {
            id: newId,
            name: 'New Name',
            age: 25,
            country: 'Country',
            date: formatDateForDisplay(today.toISOString().split('T')[0])
        };
        
        tableData.unshift(newData);
        performSearch();
        updateRecordInAPI(newData, 'POST');
    }

    // Show confirmation modal
    function showConfirmModal(id, recordData) {
        currentDeleteId = id;
        
        // Populate record details
        recordDetails.innerHTML = `
            <p><strong>Name:</strong> ${recordData.name}</p>
            <p><strong>Age:</strong> ${recordData.age}</p>
            <p><strong>Country:</strong> ${recordData.country}</p>
            <p><strong>Date:</strong> ${recordData.date}</p>
        `;
        
        confirmModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close modal
    function closeModal() {
        confirmModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentDeleteId = null;
    }

    // Perform actual delete
    function performDelete(id) {
        // Remove from local data
        tableData = tableData.filter(item => item.id !== id);
        performSearch();
        deleteRecordFromAPI(id);
    }

    // Attach delete event to button
    function attachDeleteEvent(button) {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = parseInt(row.dataset.id);
            const recordData = tableData.find(item => item.id === id);
            
            if (recordData) {
                showConfirmModal(id, recordData);
            }
        });
    }

    // Attach edit events to editable cells - Fixed for date handling
    function attachEditEvents(row) {
        const editableCells = row.querySelectorAll('td[contenteditable="true"]');
        
        editableCells.forEach(cell => {
            // Handle click event for date cells
            cell.addEventListener('click', function(e) {
                if (this.dataset.field === 'date') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.blur(); // Remove focus from the cell
                    openDatePicker(this);
                }
            });

            cell.addEventListener('focus', function() {
                // For date fields, prevent focus and open picker instead
                if (this.dataset.field === 'date') {
                    this.blur();
                    openDatePicker(this);
                    return;
                }
                
                // Remove highlighting when editing for non-date fields
                const text = this.textContent;
                this.innerHTML = text;
            });
            
            cell.addEventListener('blur', function() {
                if (this.dataset.field !== 'date') {
                    handleCellEdit(this);
                }
            });
            
            cell.addEventListener('keydown', function(e) {
                if (this.dataset.field === 'date') {
                    // For date fields, open picker on Enter or Space
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.blur();
                        openDatePicker(this);
                    }
                    // Prevent any other key input for date fields
                    else if (e.key !== 'Tab') {
                        e.preventDefault();
                    }
                } else {
                    // For other fields, submit on Enter
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.blur();
                    }
                }
            });

            // Prevent typing in date fields completely
            cell.addEventListener('input', function(e) {
                if (this.dataset.field === 'date') {
                    e.preventDefault();
                    // Restore original content if someone tries to type
                    const id = parseInt(this.closest('tr').dataset.id);
                    const item = tableData.find(item => item.id === id);
                    if (item) {
                        this.textContent = item.date;
                        this.innerHTML = item.date;
                    }
                    return false;
                }
            });

            // Prevent paste in date fields
            cell.addEventListener('paste', function(e) {
                if (this.dataset.field === 'date') {
                    e.preventDefault();
                    return false;
                }
            });
        });
    }

    // Open date picker for date fields
    function openDatePicker(dateCell) {
        // Prevent multiple date pickers from opening
        if (currentEditingDateCell) {
            currentEditingDateCell.style.backgroundColor = '';
            currentEditingDateCell.style.outline = '';
        }
        
        // Set the current editing cell
        currentEditingDateCell = dateCell;
        
        // Get current date value and convert to input format
        const currentDate = dateCell.textContent.trim();
        const inputDate = formatDateForInput(currentDate);
        
        // Set the hidden date picker value
        hiddenDatePicker.value = inputDate || '';
        
        // Add visual feedback immediately
        dateCell.style.backgroundColor = '#fff5b7';
        dateCell.style.outline = '2px solid #4CAF50';
        dateCell.style.outlineOffset = '-2px';
        
        // Make the date picker temporarily visible and functional
        hiddenDatePicker.style.position = 'fixed';
        hiddenDatePicker.style.top = '50%';
        hiddenDatePicker.style.left = '50%';
        hiddenDatePicker.style.transform = 'translate(-50%, -50%)';
        hiddenDatePicker.style.opacity = '0';
        hiddenDatePicker.style.pointerEvents = 'auto';
        hiddenDatePicker.style.zIndex = '9999';
        
        // Focus and trigger the date picker
        setTimeout(() => {
            hiddenDatePicker.focus();
            if (hiddenDatePicker.showPicker) {
                hiddenDatePicker.showPicker();
            } else {
                hiddenDatePicker.click();
            }
        }, 1000);

        // Hide the date picker again after a short delay
        setTimeout(() => {
            hiddenDatePicker.style.position = 'fixed';
            hiddenDatePicker.style.top = '-100px';
            hiddenDatePicker.style.left = '-100px';
            hiddenDatePicker.style.opacity = '0';
            hiddenDatePicker.style.pointerEvents = 'none';
            hiddenDatePicker.style.zIndex = '-1';
        }, 1000);
        
        // Fallback: Remove visual feedback after 5 seconds if no date is selected
        setTimeout(() => {
            if (dateCell === currentEditingDateCell) {
                dateCell.style.backgroundColor = '';
                dateCell.style.outline = '';
                currentEditingDateCell = null;
            }
        }, 50000);
    }

    // Handle cell edit
    function handleCellEdit(cell) {
        const row = cell.closest('tr');
        const id = parseInt(row.dataset.id);
        const field = cell.dataset.field;
        const newValue = cell.textContent.trim();
        
        // Update local data
        const item = tableData.find(item => item.id === id);
        
        if (item) {
            let processedValue;
            if (field === 'age') {
                processedValue = parseInt(newValue) || 0;
            } else {
                processedValue = newValue;
            }
            
            item[field] = processedValue;
            
            // Re-apply search filter to update filtered data
            performSearch();
            
            // Call API to update record
            updateRecordInAPI(item, 'PUT');
        }
    }

    // Update record in API
    async function updateRecordInAPI(data, method = 'PUT') {
        try {
            const url = method === 'POST' ? `${API_BASE_URL}/users` : `${API_BASE_URL}/users/${data.id}`;
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    age: data.age,
                    address: {
                        city: data.country
                    },
                    date: data.date
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`Record ${method === 'POST' ? 'created' : 'updated'} successfully:`, result);
            showSuccessMessage(`Record ${method === 'POST' ? 'added' : 'updated'} successfully`);
        } catch (error) {
            console.error('Error updating record:', error);
            showErrorMessage('Failed to update record');
        }
    }

    // Delete record from API
    async function deleteRecordFromAPI(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log(`Record ${id} deleted successfully`);
            showSuccessMessage('Record deleted successfully');
        } catch (error) {
            console.error('Error deleting record:', error);
            showErrorMessage('Failed to delete record');
        }
    }

    // UI Helper Functions
    function showLoadingState() {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading data...</td></tr>';
        pageInfo.textContent = 'Loading...';
    }

    function hideLoadingState() {
        // Loading state is hidden when table is rendered
    }

    function showSuccessMessage(message) {
        showMessage(message, 'success');
    }

    function showErrorMessage(message) {
        showMessage(message, 'error');
    }

    function showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        
        document.body.appendChild(messageEl);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
});