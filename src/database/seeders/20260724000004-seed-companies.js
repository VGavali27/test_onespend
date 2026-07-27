/**
 * Seeder: Insert demo companies — all under Kings Group Ventures
 */
export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert('companies', [
    {
      id: 100, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780001',
      group_id: 100, name: 'XPONENTIAL DATA AND BUSINESS SERVICES PVT. LTD.', code: 'XDBSPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 101, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780002',
      group_id: 100, name: 'SHRI RAVINDER JOSHI CHARITABLE FOUNDATION', code: 'SRJCF',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 102, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780003',
      group_id: 100, name: 'H SERIES PRIVATE LIMITED', code: 'HSPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 103, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780004',
      group_id: 100, name: 'QUALEAD TECHNOLOGY SERVICES LLP', code: 'QTSLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 104, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780005',
      group_id: 100, name: 'ANAND FINHOUSE CONSULTING LLP', code: 'AFHCLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 105, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780006',
      group_id: 100, name: 'KINGS FOODTECH PRIVATE LIMITED', code: 'KFPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 106, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780007',
      group_id: 100, name: 'KINGS RESTAURANTS LLP', code: 'KRLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 107, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780008',
      group_id: 100, name: 'KINGS CAR CARE LLP', code: 'KCCLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 108, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780009',
      group_id: 100, name: 'ONDOT MEDIA INDIA PRIVATE LIMITED', code: 'OMIPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 109, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780010',
      group_id: 100, name: 'KINGS RESEARCH PRIVATE LIMITED', code: 'KRPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 110, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780011',
      group_id: 100, name: 'KINGS DIGITAL MEDIA PRIVATE LIMITED', code: 'KDMPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 111, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780012',
      group_id: 100, name: 'JANTA DRY CLEANERS LLP', code: 'JDCLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 112, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780013',
      group_id: 100, name: 'KINGS ONE DIGITAL SERVICES LLP', code: 'KODSLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 113, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780014',
      group_id: 100, name: 'ODM DIGITAL LLP', code: 'ODMLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 114, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780015',
      group_id: 100, name: 'ON DIRECT MARKETING SERVICES LLP', code: 'ONDIRECT',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 115, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780016',
      group_id: 100, name: 'KINGS REALTY MANAGEMENT LLP', code: 'KRMLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 116, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780017',
      group_id: 100, name: 'MEDIUM RAW HOSPITALITY PRIVATE LIMITED', code: 'MRHPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 117, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780018',
      group_id: 100, name: 'FYYRE DINING HOSPITALITY LLP', code: 'FDHLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 118, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780019',
      group_id: 100, name: 'KINGS PROPERTY MANAGEMENT LLP', code: 'KPMLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 119, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780020',
      group_id: 100, name: 'KINGS PUBLISHING HOUSE LLP', code: 'KPHLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 120, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780021',
      group_id: 100, name: 'KINGS OFFICE SPACES LLP', code: 'KOSLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 121, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780022',
      group_id: 100, name: 'KINGSCRAFT SPIRIT PROJECTS LLP', code: 'KSPLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 122, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780023',
      group_id: 100, name: 'NOOR LUXE HOMES PRIVATE LIMITED', code: 'NLHPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 123, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780024',
      group_id: 100, name: 'KINGSCRAFT ESTATE MANAGEMENT LLP', code: 'KEMLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 124, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780025',
      group_id: 100, name: 'BLACKCABS TRANSPORT LLP', code: 'BCTLLP',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 125, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780026',
      group_id: 100, name: 'KINGSCRAFT ONLINE BRANDS PRIVATE LIMITED', code: 'KOBPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 126, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780027',
      group_id: 100, name: 'XPONENTIAL KINGS TECHNOLOGIES PRIVATE LIMITED', code: 'XKTPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
    {
      id: 127, uuid: 'c1d2e3f4-a5b6-7890-cdef-123456780028',
      group_id: 100, name: 'KINGSCRAFT AVIATION PRIVATE LIMITED', code: 'KAPPL',
      status: 'ACTIVE', created_at: new Date(), updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface, _Sequelize) {
  return queryInterface.bulkDelete('companies', {
    group_id: 100,
  }, {});
}
